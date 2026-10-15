-- Incremental migration for existing PumpMetrics databases.
-- Run in phpMyAdmin after selecting your database.
-- Safe to re-run: each statement checks whether the column already exists.

-- Station code
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'stations'
    AND COLUMN_NAME = 'station_code'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE stations ADD COLUMN station_code VARCHAR(50) NULL AFTER name',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Unit number
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pumps'
    AND COLUMN_NAME = 'unit_number'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE pumps ADD COLUMN unit_number VARCHAR(50) NULL AFTER name',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Nozzle number
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pumps'
    AND COLUMN_NAME = 'nozzle_number'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE pumps ADD COLUMN nozzle_number VARCHAR(50) NULL AFTER unit_number',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Reading price
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'daily_readings'
    AND COLUMN_NAME = 'price'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE daily_readings ADD COLUMN price DECIMAL(10,2) NULL AFTER liters_sold',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
