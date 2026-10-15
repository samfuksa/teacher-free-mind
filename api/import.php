<?php
// api/import.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$pdo = getDb();
$input = getJsonInput();

// Podpora pro upload souboru multipart/form-data nebo přímý JSON v body
if (empty($input) && isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $content = file_get_contents($_FILES['file']['tmp_name']);
    $input = json_decode($content, true);
}

if (empty($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Nebyla nahrána žádná data nebo je JSON neplatný.']);
    exit;
}

$title = $input['room']['title'] ?? ($input['title'] ?? 'Importovaná mapa');
$nodes = $input['nodes'] ?? [];
$edges = $input['edges'] ?? [];

// Vygenerovat nový zvací kód pro novou relaci
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

// Vložit uzly
$insertNode = $pdo->prepare('INSERT INTO nodes (room_id, id, type, position_x, position_y, label, color, author_name, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($nodes as $n) {
    $id = $n['id'] ?? ('node-' . rand(1000, 99999));
    $type = $n['type'] ?? 'customMindMap';
    $x = $n['position']['x'] ?? 0;
    $y = $n['position']['y'] ?? 0;
    $label = $n['data']['label'] ?? ($n['label'] ?? 'Téma');
    $color = $n['data']['color'] ?? ($n['color'] ?? '#3b82f6');
    $author = $n['data']['authorName'] ?? ($n['author_name'] ?? 'Původní');

    $insertNode->execute([$roomId, $id, $type, $x, $y, $label, $color, $author, $now]);
}

// Vložit hrany
if (!empty($edges)) {
    $insertEdge = $pdo->prepare('INSERT INTO edges (room_id, id, source, target, label, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    foreach ($edges as $e) {
        $insertEdge->execute([
            $roomId,
            $e['id'] ?? ('edge-' . rand(1000, 99999)),
            $e['source'],
            $e['target'],
            $e['label'] ?? '',
            $now
        ]);
    }
}

echo json_encode([
    'ok' => true,
    'message' => 'Mapa byla úspěšně importována jako nová místnost!',
    'room' => [
        'id' => $roomId,
        'code' => $code,
        'admin_token' => $adminToken,
        'title' => $title,
        'is_locked' => false,
        'created_at' => date('Y-m-d H:i:s')
    ]
], JSON_UNESCAPED_UNICODE);
