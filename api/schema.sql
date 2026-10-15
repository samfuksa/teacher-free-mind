-- Databáze pro aplikaci Myšlenkové Mapy (Teacher Free Mind)
-- Vytvoření databáze (pokud ještě neexistuje):
CREATE DATABASE IF NOT EXISTS `mindmap_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `mindmap_db`;

-- 1. Tabulka místností (map)
CREATE TABLE IF NOT EXISTS `rooms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(16) NOT NULL UNIQUE COMMENT 'Zvací kód pro studenty, např. TFM-842',
    `admin_token` VARCHAR(64) NOT NULL COMMENT 'Tajný token zakladatele pro správu',
    `title` VARCHAR(255) NOT NULL DEFAULT 'Nová myšlenková mapa',
    `is_locked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = pouze pro čtení',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabulka uzlů myšlenkové mapy
CREATE TABLE IF NOT EXISTS `nodes` (
    `room_id` INT NOT NULL,
    `id` VARCHAR(64) NOT NULL,
    `type` VARCHAR(32) NOT NULL DEFAULT 'customMindMap',
    `position_x` FLOAT NOT NULL DEFAULT 0,
    `position_y` FLOAT NOT NULL DEFAULT 0,
    `label` TEXT NOT NULL,
    `color` VARCHAR(32) NOT NULL DEFAULT '#3b82f6',
    `author_name` VARCHAR(100) NOT NULL DEFAULT 'Učitel',
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `updated_at` BIGINT NOT NULL COMMENT 'Unix timestamp v milisekundách',
    PRIMARY KEY (`room_id`, `id`),
    CONSTRAINT `fk_nodes_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabulka spojení (hran) mezi uzly
CREATE TABLE IF NOT EXISTS `edges` (
    `room_id` INT NOT NULL,
    `id` VARCHAR(64) NOT NULL,
    `source` VARCHAR(64) NOT NULL,
    `target` VARCHAR(64) NOT NULL,
    `source_handle` VARCHAR(32) DEFAULT NULL,
    `target_handle` VARCHAR(32) DEFAULT NULL,
    `label` VARCHAR(255) DEFAULT '',
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `updated_at` BIGINT NOT NULL COMMENT 'Unix timestamp v milisekundách',
    PRIMARY KEY (`room_id`, `id`),
    CONSTRAINT `fk_edges_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabulka aktivních účastníků (pro zobrazení online studentů)
CREATE TABLE IF NOT EXISTS `collaborators` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `room_id` INT NOT NULL,
    `session_id` VARCHAR(64) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `color` VARCHAR(32) NOT NULL DEFAULT '#10b981',
    `last_active` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_room_session` (`room_id`, `session_id`),
    CONSTRAINT `fk_collaborators_room` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
