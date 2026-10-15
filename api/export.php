<?php
// api/export.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$code = strtoupper(trim($_GET['code'] ?? ''));

if (empty($code)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Chybí kód místnosti.']);
    exit;
}

$pdo = getDb();
$stmt = $pdo->prepare('SELECT id, code, title, created_at FROM rooms WHERE code = ?');
$stmt->execute([$code]);
$room = $stmt->fetch();

if (!$room) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Místnost nebyla nalezena.']);
    exit;
}

$roomId = (int) $room['id'];

// Načíst všechny platné uzly
$nodeStmt = $pdo->prepare('SELECT id, type, position_x, position_y, label, color, author_name FROM nodes WHERE room_id = ? AND is_deleted = 0');
$nodeStmt->execute([$roomId]);
$nodes = [];
while ($row = $nodeStmt->fetch()) {
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
$edgeStmt = $pdo->prepare('SELECT id, source, target, source_handle, target_handle, label FROM edges WHERE room_id = ? AND is_deleted = 0');
$edgeStmt->execute([$roomId]);
$edges = [];
while ($row = $edgeStmt->fetch()) {
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

$exportData = [
    'version' => '1.0',
    'app' => 'Teacher Free Mind',
    'exportedAt' => date('c'),
    'room' => [
        'title' => $room['title'],
        'originalCode' => $room['code']
    ],
    'nodes' => $nodes,
    'edges' => $edges
];

if (isset($_GET['download']) && $_GET['download'] === '1') {
    $filename = 'mindmap-' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $room['title']) . '-' . date('Ymd-His') . '.json';
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo json_encode($exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'ok' => true,
    'data' => $exportData
], JSON_UNESCAPED_UNICODE);
