<?php
// api/db.php
if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
} else {
    require_once __DIR__ . '/config.sample.php';
}

// Zamezit výpisu HTML chyb, které by rozbily JSON odpověď
ini_set('display_errors', '0');
error_reporting(E_ALL);

function getDb(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        // Ověření a automatické doplnění sloupců source_handle a target_handle pokud chybí
        try {
            $checkCol = $pdo->query("SHOW COLUMNS FROM `edges` LIKE 'source_handle'")->fetch();
            if (!$checkCol) {
                $pdo->exec("ALTER TABLE `edges` ADD COLUMN `source_handle` VARCHAR(32) DEFAULT NULL AFTER `target`");
                $pdo->exec("ALTER TABLE `edges` ADD COLUMN `target_handle` VARCHAR(32) DEFAULT NULL AFTER `source_handle`");
            }
        } catch (Throwable $ignore) {
            // Tabulka edges ještě nemusí existovat před prvním spuštěním schema.sql
        }

        return $pdo;
    } catch (PDOException $e) {
        // Pokud databáze ještě neexistuje, zkusíme ji vytvořit
        if ($e->getCode() == 1049) {
            try {
                $rootDsn = sprintf('mysql:host=%s;port=%s;charset=utf8mb4', DB_HOST, DB_PORT);
                $rootPdo = new PDO($rootDsn, DB_USER, DB_PASS, $options);
                $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

                $schemaFile = __DIR__ . '/schema.sql';
                if (file_exists($schemaFile)) {
                    $sql = file_get_contents($schemaFile);
                    $pdo->exec($sql);
                }
                return $pdo;
            } catch (Throwable $innerEx) {
                // Pokračujeme na vypsání chyby níže
            }
        }

        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'error' => 'Chyba připojení k SQL databázi: ' . $e->getMessage(),
            'hint' => 'Zkontrolujte, zda máte správně vyplněné přihlašovací údaje v api/config.php (databáze, uživatel, heslo).'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function generateRoomCode(): string {
    $letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    $prefix = $letters[rand(0, strlen($letters) - 1)] . $letters[rand(0, strlen($letters) - 1)];
    $digits = rand(1000, 9999);
    return $prefix . '-' . $digits;
}

function generateToken(int $length = 32): string {
    return bin2hex(random_bytes($length / 2));
}

function getCurrentTimeMs(): int {
    return (int) round(microtime(true) * 1000);
}
