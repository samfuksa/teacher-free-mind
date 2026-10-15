<?php
// api/create_room.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$pdo = getDb();
$input = getJsonInput();

$title = trim($input['title'] ?? 'Nová myšlenková mapa');
if (empty($title)) {
    $title = 'Nová myšlenková mapa';
}
$authorName = trim($input['authorName'] ?? 'Učitel');
if (empty($authorName)) {
    $authorName = 'Učitel';
}

// Vygenerovat unikátní kód
$code = '';
for ($i = 0; $i < 10; $i++) {
    $candidate = generateRoomCode();
    $stmt = $pdo->prepare('SELECT id FROM rooms WHERE code = ?');
    $stmt->execute([$candidate]);
    if (!$stmt->fetch()) {
        $code = $candidate;
        break;
    }
}
if (!$code) {
    $code = 'MAP-' . rand(100000, 999999);
}

$adminToken = generateToken(32);

$stmt = $pdo->prepare('INSERT INTO rooms (code, admin_token, title, is_locked) VALUES (?, ?, ?, 0)');
$stmt->execute([$code, $adminToken, $title]);
$roomId = (int) $pdo->lastInsertId();

$now = getCurrentTimeMs();

// Pokud byly dodány počáteční uzly (např. z importu nebo šablony)
$nodes = $input['nodes'] ?? null;
$edges = $input['edges'] ?? null;

if (empty($nodes)) {
    // Vytvoříme výchozí hlavní uzel
    $rootNodeId = 'node-root-' . time();
    $insertNode = $pdo->prepare('INSERT INTO nodes (room_id, id, type, position_x, position_y, label, color, author_name, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $insertNode->execute([
        $roomId,
        $rootNodeId,
        'customMindMap',
        250,
        200,
        $title,
        '#6366f1', // Indigo barva pro kořenový uzel
        $authorName,
        $now
    ]);
} else {
    // Uložíme zadané uzly
    $insertNode = $pdo->prepare('INSERT INTO nodes (room_id, id, type, position_x, position_y, label, color, author_name, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    foreach ($nodes as $n) {
        $insertNode->execute([
            $roomId,
            $n['id'],
            $n['type'] ?? 'customMindMap',
            $n['position']['x'] ?? 0,
            $n['position']['y'] ?? 0,
            $n['data']['label'] ?? ($n['label'] ?? 'Téma'),
            $n['data']['color'] ?? ($n['color'] ?? '#3b82f6'),
            $n['data']['authorName'] ?? ($n['author_name'] ?? $authorName),
            $now
        ]);
    }

    if (!empty($edges)) {
        $insertEdge = $pdo->prepare('INSERT INTO edges (room_id, id, source, target, label, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($edges as $e) {
            $insertEdge->execute([
                $roomId,
                $e['id'],
                $e['source'],
                $e['target'],
                $e['label'] ?? '',
                $now
            ]);
        }
    }
}

echo json_encode([
    'ok' => true,
    'room' => [
        'id' => $roomId,
        'code' => $code,
        'admin_token' => $adminToken,
        'title' => $title,
        'is_locked' => false,
        'created_at' => date('Y-m-d H:i:s')
    ]
], JSON_UNESCAPED_UNICODE);
