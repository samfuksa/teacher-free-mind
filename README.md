# Teacher Free Mind 🧠

Moderní kolaborativní webová aplikace pro tvorbu myšlenkových map ve třídě bez nutnosti registrace a přihlašování studentů.

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Flow (`@xyflow/react`), **GSAP**, **Lenis** (plynulý scroll), **React Bits** efekty (ShinyText, DecryptedText, DotPattern, Dock).
- **Backend**: Čisté PHP (REST API pro synchronizaci v reálném čase, import a export).
- **Databáze**: MySQL / MariaDB (podpora XAMPP i produkčních hostingů).

---

## 🚀 Klíčové funkce

1. **Zero-Auth (Bez registrace a hesel)**:
   - **Učitel**: Klikne na *Vytvořit mapu*, zadá téma a okamžitě získá zvací kód (např. `TFM-4821`).
   - **Studenti**: Zadají kód a své jméno, nebo se připojí přes **1-klikový přímý odkaz** (např. `https://map.samfuksa.eu/?code=TFM-4821`), kde je kód automaticky předvyplněn.
2. **Kolaborace v reálném čase**:
   - Přírůstková synchronizace změn přes SQL timestampy (žádné složité WebSocket daemony, běží na standardním PHP hostingu).
   - Každá bublina zobrazuje jméno autora a jeho barvu.
   - V horní liště jsou vidět avataři online přítomných studentů.
3. **Plná kontrola vlastníka (Zámek úprav)**:
   - Učitel může mapu jedním kliknutím uzamknout do režimu *Pouze pro čtení* (např. při výkladu nebo hodnocení).
   - Studenti mají úpravy zablokovány, zatímco učitel může v mapě nadále pracovat.
4. **Intuitivní tvorba myšlenkových map**:
   - **Směrová tlačítka `+`**: Na všech 4 stranách bubliny (vpravo, dole, vlevo, nahoře) pro okamžité vytvoření větve v daném směru.
   - **Volné přidávání bloků**: Dvojklik kamkoliv na prázdné plátno vytvoří samostatnou bublinu pod kurzorem (nebo přes tlačítko v dolním doku).
   - **Plné zaoblené čáry (Bézier)**: Spojnice jsou plné, tlusté a elegantně zakřivené; automaticky přebírají barvu své bubliny.
   - **Zvětšování bublin**: Každou bublinu lze tažením za rohy libovolně roztáhnout do šířky i výšky (`NodeResizer`).
   - **Mazání klávesou**: Označenou bublinu nebo spojnici lze smazat klávesou `Delete` nebo `Backspace`.
5. **Export & Import JSON**:
   - Možnost kdykoliv stáhnout soubor myšlenkové mapy do PC jako `.json`.
   - Později lze JSON nahrát zpět – vytvoří se nová místnost a nový kód pro studenty.

---

## 🗄️ SQL Struktura databáze

V **phpMyAdmin** (záložka *SQL*) spusťte následující příkaz:

```sql
-- 1. Vytvoření databáze (pokud ještě neexistuje)
CREATE DATABASE IF NOT EXISTS `mindmap_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `mindmap_db`;

-- 2. Tabulka místností (map)
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

-- 3. Tabulka uzlů myšlenkové mapy (bublin)
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

-- 4. Tabulka spojení (hran) mezi uzly
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

-- 5. Tabulka aktivních účastníků (online studenti)
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
```

---

## ⚙️ Lokální spuštění vývoje

### 1. Konfigurace databáze
Zkopírujte vzorový soubor `api/config.sample.php` jako `api/config.php` a zadejte své údaje (soubor `config.php` je v `.gitignore` a nebude nahrán do gitu):
```bash
cp api/config.sample.php api/config.php
```

### 2. Spuštění PHP serveru (port 8000)
Spusťte skript `start_backend.bat` nebo zadejte:
```bash
php -S localhost:8000 -t .
```

### 3. Spuštění React frontendu (port 5173)
Spusťte skript `start_frontend.bat` nebo zadejte:
```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Nahrání na webový hosting (např. Apache / Wedos / cPanel)

Pro nasazení na hosting stačí spustit skript:
```bash
package_for_hosting.bat
```
Ten automaticky:
1. Zkompiluje React frontend do optimalizovaného balíčku.
2. Sloučí jej s PHP API do složky `dist_hosting/`.
3. Přidá konfigurační soubor `.htaccess` s automatickým vynucením **HTTPS** a SPA směrováním.
4. Vytvoří hotový archiv `dist_hosting.zip`.

Obsah složky nahrajte do kořenového webového adresáře vašeho hostingu (`www/` nebo `public_html/`) a v souboru `api/config.php` na hostingu vyplňte přístup k MySQL.
