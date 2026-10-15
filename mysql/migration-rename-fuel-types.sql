-- Rename legacy fuel type labels to the new product names.
-- Run in phpMyAdmin after selecting your database. Safe to re-run.

UPDATE tanks SET fuel_type = 'Regular Petrol' WHERE fuel_type IN ('Regular', 'Regular Petrol');
UPDATE tanks SET fuel_type = 'Hi-Octane' WHERE fuel_type IN ('Premium', 'Hi-Octane');
UPDATE tanks SET fuel_type = 'Diesel' WHERE fuel_type = 'Diesel';

UPDATE pumps SET fuel_type = 'Regular Petrol' WHERE fuel_type IN ('Regular', 'Regular Petrol');
UPDATE pumps SET fuel_type = 'Hi-Octane' WHERE fuel_type IN ('Premium', 'Hi-Octane');
UPDATE pumps SET fuel_type = 'Diesel' WHERE fuel_type = 'Diesel';

UPDATE fuel_inventory SET fuel_type = 'Regular Petrol' WHERE fuel_type IN ('Regular', 'Regular Petrol');
UPDATE fuel_inventory SET fuel_type = 'Hi-Octane' WHERE fuel_type IN ('Premium', 'Hi-Octane');
UPDATE fuel_inventory SET fuel_type = 'Diesel' WHERE fuel_type = 'Diesel';
