<?php
// api/sync.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$pdo = getDb();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $code = strtoupper(trim($_GET['code'] ?? ''));
    $since = (int) ($_GET['since'] ?? 0);
    $sessionId = trim($_GET['sessionId'] ?? '');
    $name = trim($_GET['name'] ?? '');

    if (empty($code)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Chybí kód místnosti.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id, code, title, is_locked FROM rooms WHERE code = ?');
    $stmt->execute([$code]);
    $room = $stmt->fetch();

    if (!$room) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Místnost nebyla nalezena.']);
        exit;
    }

    $roomId = (int) $room['id'];

    // Obnovit heartbeat uživatele
    if (!empty($sessionId)) {
        $stmtHb = $pdo->prepare('UPDATE collaborators SET last_active = NOW() WHERE room_id = ? AND session_id = ?');
        $stmtHb->execute([$roomId, $sessionId]);
    }

    // Vybrat změněné uzly od $since
    $nodeStmt = $pdo->prepare('SELECT * FROM nodes WHERE room_id = ? AND updated_at > ?');
    $nodeStmt->execute([$roomId, $since]);
    $rawNodes = $nodeStmt->fetchAll();

    $nodes = [];
    foreach ($rawNodes as $row) {
        $nodes[] = [
            'id' => $row['id'],
            'type' => $row['type'],
            'position' => [
                'x' => (float) $row['position_x'],
                'y' => (float) $row['position_y']
            ],
            'data' => [
                'label' => $row['label'],
                'color' => $row['color'],
                'authorName' => $row['author_name']
            ],
            'is_deleted' => (bool) $row['is_deleted'],
            'updated_at' => (int) $row['updated_at']
        ];
    }

    // Vybrat změněné hrany od $since
    $edgeStmt = $pdo->prepare('SELECT * FROM edges WHERE room_id = ? AND updated_at > ?');
    $edgeStmt->execute([$roomId, $since]);
    $rawEdges = $edgeStmt->fetchAll();

    $edges = [];
    foreach ($rawEdges as $row) {
        $edges[] = [
            'id' => $row['id'],
            'source' => $row['source'],
            'target' => $row['target'],
            'sourceHandle' => $row['source_handle'] ?? null,
            'targetHandle' => $row['target_handle'] ?? null,
            'label' => $row['label'] ?? '',
            'type' => 'bezier',
            'animated' => false,
            'style' => [
                'stroke' => '#6366f1',
                'strokeWidth' => 3,
                'strokeLinecap' => 'round'
            ],
            'is_deleted' => (bool) $row['is_deleted'],
            'updated_at' => (int) $row['updated_at']
        ];
    }

    // Aktivní spolupracovníci (posledních 25 sekund)
    $collabStmt = $pdo->prepare('SELECT name, color, session_id FROM collaborators WHERE room_id = ? AND last_active >= (NOW() - INTERVAL 25 SECOND)');
    $collabStmt->execute([$roomId]);
    $collaborators = $collabStmt->fetchAll();

    echo json_encode([
        'ok' => true,
        'serverTime' => getCurrentTimeMs(),
        'room' => [
            'title' => $room['title'],
            'is_locked' => (bool) $room['is_locked']
        ],
        'nodes' => $nodes,
        'edges' => $edges,
        'collaborators' => $collaborators
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $input = getJsonInput();
    $code = strtoupper(trim($input['code'] ?? ''));
    $sessionId = trim($input['sessionId'] ?? '');
    $adminToken = trim($input['adminToken'] ?? '');

    if (empty($code)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Chybí kód místnosti.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id, is_locked, admin_token FROM rooms WHERE code = ?');
    $stmt->execute([$code]);
    $room = $stmt->fetch();

    if (!$room) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Místnost nebyla nalezena.']);
        exit;
    }

    $isAdmin = (!empty($adminToken) && $adminToken === $room['admin_token']);

    if ($room['is_locked'] && !$isAdmin) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Místnost je uzamčena učitelem pro úpravy.']);
        exit;
    }

    $roomId = (int) $room['id'];
    $now = getCurrentTimeMs();

    // 1. Zpracovat uzly (vložení nebo aktualizace)
    $upsertNodes = $input['nodes'] ?? [];
    if (!empty($upsertNodes)) {
        $stmtNode = $pdo->prepare('
            INSERT INTO nodes (room_id, id, type, position_x, position_y, label, color, author_name, is_deleted, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            ON DUPLICATE KEY UPDATE
                position_x = VALUES(position_x),
                position_y = VALUES(position_y),
                label = VALUES(label),
                color = VALUES(color),
                author_name = VALUES(author_name),
                is_deleted = 0,
                updated_at = VALUES(updated_at)
        ');

        foreach ($upsertNodes as $n) {
            $stmtNode->execute([
                $roomId,
                $n['id'],
                $n['type'] ?? 'customMindMap',
                $n['position']['x'] ?? 0,
                $n['position']['y'] ?? 0,
                $n['data']['label'] ?? 'Téma',
                $n['data']['color'] ?? '#3b82f6',
                $n['data']['authorName'] ?? 'Uživatel',
                $now
            ]);
        }
    }

    // 2. Smazané uzly (soft delete)
    $deletedNodeIds = $input['deletedNodeIds'] ?? [];
    if (!empty($deletedNodeIds)) {
        $stmtDelNode = $pdo->prepare('UPDATE nodes SET is_deleted = 1, updated_at = ? WHERE room_id = ? AND id = ?');
        foreach ($deletedNodeIds as $delId) {
            $stmtDelNode->execute([$now, $roomId, $delId]);
        }
    }

    // 3. Zpracovat hrany (vložení nebo aktualizace)
    $upsertEdges = $input['edges'] ?? [];
    if (!empty($upsertEdges)) {
        $stmtEdge = $pdo->prepare('
            INSERT INTO edges (room_id, id, source, target, source_handle, target_handle, label, is_deleted, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
            ON DUPLICATE KEY UPDATE
                source = VALUES(source),
                target = VALUES(target),
                source_handle = VALUES(source_handle),
                target_handle = VALUES(target_handle),
                label = VALUES(label),
                is_deleted = 0,
                updated_at = VALUES(updated_at)
        ');

        foreach ($upsertEdges as $e) {
            $stmtEdge->execute([
                $roomId,
                $e['id'],
                $e['source'],
                $e['target'],
                $e['sourceHandle'] ?? ($e['source_handle'] ?? null),
                $e['targetHandle'] ?? ($e['target_handle'] ?? null),
                $e['label'] ?? '',
                $now
            ]);
        }
    }

    // 4. Smazané hrany
    $deletedEdgeIds = $input['deletedEdgeIds'] ?? [];
    if (!empty($deletedEdgeIds)) {
        $stmtDelEdge = $pdo->prepare('UPDATE edges SET is_deleted = 1, updated_at = ? WHERE room_id = ? AND id = ?');
        foreach ($deletedEdgeIds as $delId) {
            $stmtDelEdge->execute([$now, $roomId, $delId]);
        }
    }

    echo json_encode([
        'ok' => true,
        'serverTime' => $now
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Metoda není povolena.']);
