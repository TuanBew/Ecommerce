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

async function updateDatabaseStructure() {
  try {
    console.log('Starting database structure update...');
    
    // Connect to database
    db.connect(async (err) => {
      if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
      }
      
      console.log('Connected to database successfully');
      
      // 1. Check and add product_is_bestseller column to products table
      try {
        console.log('Checking if product_is_bestseller column exists in products table...');
        const columnsResult = await query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'products' 
          AND COLUMN_NAME = 'product_is_bestseller'
        `);
        
        if (columnsResult.length === 0) {
          console.log('Adding product_is_bestseller column to products table...');
          await query(`
            ALTER TABLE products 
            ADD COLUMN product_is_bestseller TINYINT(1) NOT NULL DEFAULT 0 
            AFTER product_name
          `);
          console.log('Column added successfully');
        } else {
          console.log('product_is_bestseller column already exists in products table');
        }
      } catch (error) {
        console.error('Error updating products table:', error);
      }
      
      // 2. Check and add product_variant_is_bestseller column to product_variants table
      try {
        console.log('Checking if product_variant_is_bestseller column exists in product_variants table...');
        const columnsResult = await query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'product_variants' 
          AND COLUMN_NAME = 'product_variant_is_bestseller'
        `);
        
        if (columnsResult.length === 0) {
          console.log('Adding product_variant_is_bestseller column to product_variants table...');
          await query(`
            ALTER TABLE product_variants 
            ADD COLUMN product_variant_is_bestseller TINYINT(1) NOT NULL DEFAULT 0 
            AFTER product_variant_name
          `);
          console.log('Column added successfully');
        } else {
          console.log('product_variant_is_bestseller column already exists in product_variants table');
        }
      } catch (error) {
        console.error('Error updating product_variants table:', error);
      }
      
      // 3. Check categorry_type column in categories table
      try {
        console.log('Checking if categorry_type column exists in categories table...');
        const columnsResult = await query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'categories' 
          AND COLUMN_NAME = 'categorry_type'
        `);
        
        if (columnsResult.length === 0) {
          console.log('Adding categorry_type column to categories table...');
          await query(`
            ALTER TABLE categories 
            ADD COLUMN categorry_type VARCHAR(50) DEFAULT 'Other' 
            AFTER category_name
          `);
          console.log('Column added successfully');
        } else {
          console.log('categorry_type column already exists in categories table');
        }
      } catch (error) {
        console.error('Error updating categories table:', error);
      }
      
      console.log('Database structure update completed');
      db.end();
    });
    
  } catch (error) {
    console.error('Error in update process:', error);
    process.exit(1);
  }
}

updateDatabaseStructure();
