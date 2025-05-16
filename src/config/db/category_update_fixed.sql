-- Update category names in the database with exact case matching
UPDATE categories SET category_name = 'Laptop' WHERE category_name = 'Điện Máy' OR category_name = 'điện máy';
UPDATE categories SET category_name = 'PC' WHERE category_name = 'Điện tử' OR category_name = 'điện tử';
UPDATE categories SET category_name = 'Linh Kiện' WHERE category_name = 'Nhà bếp' OR category_name = 'nhà bếp';
UPDATE categories SET category_name = 'Gaming Gear' WHERE category_name = 'Gia dụng' OR category_name = 'gia dụng';
