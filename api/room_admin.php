<?php
// api/room_admin.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$pdo = getDb();
$input = getJsonInput();

$code = strtoupper(trim($input['code'] ?? ''));
$adminToken = trim($input['adminToken'] ?? '');
$action = trim($input['action'] ?? '');

if (empty($code) || empty($adminToken)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Chybí kód nebo administrátorský token.']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, admin_token, is_locked, title FROM rooms WHERE code = ?');
$stmt->execute([$code]);
$room = $stmt->fetch();

if (!$room || $room['admin_token'] !== $adminToken) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Neplatný administrátorský token pro tuto místnost.']);
    exit;
}

$roomId = (int) $room['id'];

if ($action === 'toggle_lock') {
    $newStatus = $room['is_locked'] ? 0 : 1;
    $upd = $pdo->prepare('UPDATE rooms SET is_locked = ? WHERE id = ?');
    $upd->execute([$newStatus, $roomId]);

    echo json_encode([
        'ok' => true,
        'is_locked' => (bool) $newStatus,
        'message' => $newStatus ? 'Místnost byla uzamčena pro studenty.' : 'Místnost byla odemčena pro úpravy.'
    ]);
    exit;
}

if ($action === 'update_title') {
    $newTitle = trim($input['title'] ?? '');
    if (!empty($newTitle)) {
        $upd = $pdo->prepare('UPDATE rooms SET title = ? WHERE id = ?');
        $upd->execute([$newTitle, $roomId]);
    }
    echo json_encode(['ok' => true, 'title' => $newTitle]);
    exit;
}

if ($action === 'clear_map') {
    // Smazat všechny uzly a hrany v místnosti
    $delNodes = $pdo->prepare('UPDATE nodes SET is_deleted = 1, updated_at = ? WHERE room_id = ?');
    $now = getCurrentTimeMs();
    $delNodes->execute([$now, $roomId]);

    $delEdges = $pdo->prepare('UPDATE edges SET is_deleted = 1, updated_at = ? WHERE room_id = ?');
    $delEdges->execute([$now, $roomId]);

    echo json_encode(['ok' => true, 'message' => 'Mapa byla pročištěna.']);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'Neznámá akce.']);
