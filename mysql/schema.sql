-- ============================================================
-- PumpMetrics - complete MySQL setup script
-- ============================================================
-- Creates every table and the first Super Admin login.
--
-- Hostinger / phpMyAdmin:
--   Create the database in hPanel first, select it in phpMyAdmin,
--   open the SQL tab, paste this whole file and press Go.
--   Leave the two CREATE DATABASE / USE lines below commented out.
--
-- VPS or local MySQL command line, into a database you already created:
--   mysql -u root -p pumpmetrics < mysql/schema.sql
--
-- Or uncomment the two lines below to have the script create the
--   database itself, then run: mysql -u root -p < mysql/schema.sql
-- ============================================================

-- CREATE DATABASE IF NOT EXISTS pumpmetrics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE pumpmetrics;

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stations (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    location     VARCHAR(255) NULL,
    phone        VARCHAR(20)  NULL,
    manager_name VARCHAR(100) NULL,
    created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('super_admin','station_manager','cashier') NOT NULL DEFAULT 'cashier',
    station_id    INT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY users_email_key (email),
    KEY users_station_id_idx (station_id),
    CONSTRAINT users_station_id_fkey FOREIGN KEY (station_id)
        REFERENCES stations(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pumps (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    fuel_type  VARCHAR(50) NOT NULL,
    station_id INT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY pumps_station_id_idx (station_id),
    CONSTRAINT pumps_station_id_fkey FOREIGN KEY (station_id)
        REFERENCES stations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_readings (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    pump_id       INT NOT NULL,
    reading_date  DATE NOT NULL,
    start_reading DECIMAL(10,2) NOT NULL,
    end_reading   DECIMAL(10,2) NOT NULL,
    liters_sold   DECIMAL(10,2) NOT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY daily_readings_pump_id_idx (pump_id),
    KEY daily_readings_reading_date_idx (reading_date),
    CONSTRAINT daily_readings_pump_id_fkey FOREIGN KEY (pump_id)
        REFERENCES pumps(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fuel_inventory (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    fuel_type            VARCHAR(50) NOT NULL,
    current_stock        DECIMAL(10,2) NOT NULL,
    station_id           INT NULL,
    last_delivery_date   DATE NULL,
    last_delivery_amount DECIMAL(10,2) NULL,
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    KEY fuel_inventory_station_id_idx (station_id),
    CONSTRAINT fuel_inventory_station_id_fkey FOREIGN KEY (station_id)
        REFERENCES stations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_sales (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    sale_date     DATE NOT NULL,
    cash_revenue  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    card_revenue  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_revenue DECIMAL(10,2) NOT NULL,
    station_id    INT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY store_sales_station_id_idx (station_id),
    KEY store_sales_sale_date_idx (sale_date),
    CONSTRAINT store_sales_station_id_fkey FOREIGN KEY (station_id)
        REFERENCES stations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- First Super Admin
--
--   Email:    admin@pumpmetrics.com
--   Password: Admin@12345
--
-- Change the password from the Users page right after your first
-- login. The string below is a bcrypt hash, not the password --
-- editing it by hand will lock you out.
-- ------------------------------------------------------------

INSERT IGNORE INTO users (name, email, password_hash, role, station_id)
VALUES (
    'Super Admin',
    'admin@pumpmetrics.com',
    '$2b$10$3JiGxHAzJmcgjkhg6aSinedxTq2pe12zdR39SQn1I2XCsSZHh/6I.',
    'super_admin',
    NULL
);
