-- Check if categorry_type column exists, and add it if it doesn't
SET @column_exists = 0;
SELECT COUNT(*) INTO @column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'categories' 
  AND COLUMN_NAME = 'categorry_type';

SET @add_column = CONCAT('ALTER TABLE categories ADD COLUMN categorry_type VARCHAR(50) DEFAULT \'Khác\' AFTER category_name');
PREPARE stmt FROM @add_column;
SET @exec_stmt = IF(@column_exists = 0, 'EXECUTE stmt', 'SELECT \'Column already exists\' AS message');
PREPARE exec_stmt FROM @exec_stmt;
EXECUTE exec_stmt;
DEALLOCATE PREPARE stmt;
DEALLOCATE PREPARE exec_stmt;

-- Update standard category types
UPDATE categories SET categorry_type = 'Laptop' WHERE LOWER(category_name) LIKE '%laptop%' OR LOWER(category_name) LIKE '%máy tính xách tay%';
UPDATE categories SET categorry_type = 'PC' WHERE LOWER(category_name) LIKE '%pc%' OR LOWER(category_name) LIKE '%máy tính%' OR LOWER(category_name) LIKE '%desktop%';
UPDATE categories SET categorry_type = 'Linh Kiện' WHERE LOWER(category_name) LIKE '%linh kiện%' OR LOWER(category_name) LIKE '%phụ kiện%' OR LOWER(category_name) LIKE '%hardware%';
UPDATE categories SET categorry_type = 'Gaming Gear' WHERE LOWER(category_name) LIKE '%gaming%' OR LOWER(category_name) LIKE '%game%';
UPDATE categories SET categorry_type = 'Khác' WHERE categorry_type IS NULL OR categorry_type = '';

-- Create a default category if none exists
INSERT INTO categories (category_name, categorry_type, category_is_display, category_added_date)
SELECT 'Khác', 'Khác', 1, NOW()
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Fix products with null or invalid category IDs
UPDATE products p
SET p.category_id = (SELECT c.category_id FROM categories c LIMIT 1)
WHERE p.category_id IS NULL OR p.category_id NOT IN (SELECT c.category_id FROM categories c);

-- Ensure all categories have an image
UPDATE categories SET category_img = 'default_category.jpg' WHERE category_img IS NULL OR category_img = '';
