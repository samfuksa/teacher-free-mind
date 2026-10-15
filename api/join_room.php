<?php
// api/join_room.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$pdo = getDb();
$input = getJsonInput();

$code = strtoupper(trim($input['code'] ?? ''));
$name = trim($input['name'] ?? 'Anonym');
$sessionId = trim($input['sessionId'] ?? '');

if (empty($code)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Chybí kód místnosti.']);
    exit;
}

if (empty($name)) {
    $name = 'Host ' . rand(10, 99);
}

if (empty($sessionId)) {
    $sessionId = generateToken(16);
}

$stmt = $pdo->prepare('SELECT * FROM rooms WHERE code = ?');
$stmt->execute([$code]);
$room = $stmt->fetch();

if (!$room) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Místnost se zadaným kódem nebyla nalezena. Ověřte kód.']);
    exit;
}

$roomId = (int) $room['id'];

// Přidat / obnovit záznam v collaborators
$userColors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
$chosenColor = $userColors[array_rand($userColors)];

$stmtCollab = $pdo->prepare('
    INSERT INTO collaborators (room_id, session_id, name, color, last_active)
    VALUES (?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE name = VALUES(name), last_active = NOW()
');
$stmtCollab->execute([$roomId, $sessionId, $name, $chosenColor]);

// Načíst všechny platné uzly
$nodeStmt = $pdo->prepare('SELECT * FROM nodes WHERE room_id = ? AND is_deleted = 0');
$nodeStmt->execute([$roomId]);
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
        ]
    ];
}

// Načíst všechny platné hrany
$edgeStmt = $pdo->prepare('SELECT * FROM edges WHERE room_id = ? AND is_deleted = 0');
$edgeStmt->execute([$roomId]);
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
        ]
    ];
}

// Načíst aktivní spolupracovníky (posledních 30 sekund)
$collabStmt = $pdo->prepare('SELECT name, color, session_id FROM collaborators WHERE room_id = ? AND last_active >= (NOW() - INTERVAL 30 SECOND)');
$collabStmt->execute([$roomId]);
$activeCollaborators = $collabStmt->fetchAll();

echo json_encode([
    'ok' => true,
    'room' => [
        'id' => $roomId,
        'code' => $room['code'],
        'title' => $room['title'],
        'is_locked' => (bool) $room['is_locked'],
        'created_at' => $room['created_at']
    ],
    'user' => [
        'sessionId' => $sessionId,
        'name' => $name,
        'color' => $chosenColor
    ],
    'serverTime' => getCurrentTimeMs(),
    'nodes' => $nodes,
    'edges' => $edges,
    'collaborators' => $activeCollaborators
], JSON_UNESCAPED_UNICODE);
