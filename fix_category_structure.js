const mysql = require('mysql');
const util = require('util');
const dotenv = require('dotenv').config();

// Create database connection
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

// Promisify database queries
const query = util.promisify(db.query).bind(db);

async function fixCategoryStructure() {
  try {
    console.log('Starting category structure fix process...');
    
    // Connect to database
    db.connect(async (err) => {
      if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
      }
      
      console.log('Connected to database successfully');
      
      // Step 1: Check if categorry_type column exists
      console.log('\n[Step 1] Checking if categorry_type column exists...');
      try {
        const columns = await query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'categorry_type'
        `, [process.env.DATABASE]);
        
        if (columns.length === 0) {
          console.log('categorry_type column does not exist, creating it...');
          await query(`ALTER TABLE categories ADD COLUMN categorry_type VARCHAR(50) DEFAULT 'Khác' AFTER category_name`);
          console.log('categorry_type column created successfully');
        } else {
          console.log('categorry_type column already exists');
        }
      } catch (error) {
        console.error('Error checking/creating categorry_type column:', error);
      }
      
      // Step 2: Update standard category types
      console.log('\n[Step 2] Updating standard category types...');
      try {
        await query(`UPDATE categories SET categorry_type = 'Laptop' WHERE LOWER(category_name) LIKE '%laptop%' OR LOWER(category_name) LIKE '%máy tính xách tay%'`);
        await query(`UPDATE categories SET categorry_type = 'PC' WHERE LOWER(category_name) LIKE '%pc%' OR LOWER(category_name) LIKE '%máy tính%' OR LOWER(category_name) LIKE '%desktop%'`);
        await query(`UPDATE categories SET categorry_type = 'Linh Kiện' WHERE LOWER(category_name) LIKE '%linh kiện%' OR LOWER(category_name) LIKE '%phụ kiện%' OR LOWER(category_name) LIKE '%hardware%'`);
        await query(`UPDATE categories SET categorry_type = 'Gaming Gear' WHERE LOWER(category_name) LIKE '%gaming%' OR LOWER(category_name) LIKE '%game%'`);
        await query(`UPDATE categories SET categorry_type = 'Khác' WHERE categorry_type IS NULL OR categorry_type = ''`);
        console.log('Category types updated successfully');
      } catch (error) {
        console.error('Error updating category types:', error);
      }
      
      // Step 3: Check for products with null or invalid category IDs
      console.log('\n[Step 3] Checking for products with invalid category IDs...');
      try {
        const orphanedProducts = await query(`
          SELECT p.* FROM products p 
          LEFT JOIN categories c ON p.category_id = c.category_id 
          WHERE c.category_id IS NULL OR p.category_id IS NULL
        `);
        
        if (orphanedProducts.length > 0) {
          console.log(`Found ${orphanedProducts.length} products with invalid category references`);
          
          // Create a default category if none exists
          const defaultCategory = await query(`SELECT * FROM categories LIMIT 1`);
          let defaultCategoryId;
          
          if (defaultCategory.length === 0) {
            const result = await query(`
              INSERT INTO categories (category_name, categorry_type, category_is_display, category_added_date) 
              VALUES ('Khác', 'Khác', 1, NOW())
            `);
            defaultCategoryId = result.insertId;
            console.log(`Created default category with ID: ${defaultCategoryId}`);
          } else {
            defaultCategoryId = defaultCategory[0].category_id;
          }
          
          // Update orphaned products
          await query(`UPDATE products SET category_id = ? WHERE category_id IS NULL OR category_id NOT IN (SELECT category_id FROM categories)`, [defaultCategoryId]);
          console.log(`Updated ${orphanedProducts.length} products to use category ID ${defaultCategoryId}`);
        } else {
          console.log('No products with invalid category references found');
        }
      } catch (error) {
        console.error('Error fixing products with invalid category references:', error);
      }
      
      // Step 4: Ensure all categories have an image
      console.log('\n[Step 4] Checking for categories without images...');
      try {
        const categoriesWithoutImages = await query(`SELECT * FROM categories WHERE category_img IS NULL OR category_img = ''`);
        
        if (categoriesWithoutImages.length > 0) {
          console.log(`Found ${categoriesWithoutImages.length} categories without images`);
          
          // Update categories to use a default image
          await query(`UPDATE categories SET category_img = 'default_category.jpg' WHERE category_img IS NULL OR category_img = ''`);
          console.log('Updated categories without images to use default image');
        } else {
          console.log('All categories have images');
        }
      } catch (error) {
        console.error('Error fixing categories without images:', error);
      }
      
      console.log('\nCategory structure fix process completed');
      db.end();
    });
    
  } catch (error) {
    console.error('Error in fix process:', error);
    process.exit(1);
  }
}

fixCategoryStructure();
