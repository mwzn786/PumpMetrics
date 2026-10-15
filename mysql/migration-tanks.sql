-- Incremental migration: tanks + link nozzles to supply tanks.
-- Run in phpMyAdmin after selecting your database. Safe to re-run.

-- tanks table
CREATE TABLE IF NOT EXISTS tanks (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(100) NOT NULL,
    fuel_type      VARCHAR(50) NOT NULL,
    color          VARCHAR(20) NOT NULL,
    max_capacity   DECIMAL(12,2) NOT NULL,
    current_stock  DECIMAL(12,2) NOT NULL,
    station_id     INT NOT NULL,
    created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    KEY tanks_station_id_idx (station_id),
    CONSTRAINT tanks_station_id_fkey FOREIGN KEY (station_id)
        REFERENCES stations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- pumps.tank_id
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pumps'
    AND COLUMN_NAME = 'tank_id'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE pumps ADD COLUMN tank_id INT NULL AFTER station_id, ADD KEY pumps_tank_id_idx (tank_id), ADD CONSTRAINT pumps_tank_id_fkey FOREIGN KEY (tank_id) REFERENCES tanks(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
