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

async function checkAndFixDatabase() {
  try {
    console.log('Starting database check and fix...');
    
    // Connect to database
    db.connect(async (err) => {
      if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
      }
      
      console.log('Connected to database successfully');
      
      // Check products table schema
      console.log('Checking products table schema...');
      const productsColumns = await query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'products'
      `);
      
      const columnNames = productsColumns.map(col => col.COLUMN_NAME);
      console.log('Columns in products table:', columnNames.join(', '));
      
      // Check if specific columns exist and try to fix any issues
      const requiredColumns = [
        {
          name: 'product_is_bestseller',
          type: 'TINYINT(1)',
          default: '0',
          after: 'product_name'
        },
        {
          name: 'product_is_display',
          type: 'TINYINT(1)', 
          default: '1',
          after: 'product_added_date'
        }
      ];
      
      for (const col of requiredColumns) {
        if (!columnNames.includes(col.name)) {
          console.log(`Adding missing column ${col.name} to products table...`);
          try {
            await query(`
              ALTER TABLE products 
              ADD COLUMN ${col.name} ${col.type} NOT NULL DEFAULT ${col.default} 
              AFTER ${col.after}
            `);
            console.log(`Column ${col.name} added successfully`);
          } catch (err) {
            console.error(`Error adding column ${col.name}:`, err);
          }
        } else {
          console.log(`Column ${col.name} already exists`);
        }
      }
      
      // Check product_variants table schema
      console.log('\nChecking product_variants table schema...');
      const variantsColumns = await query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'product_variants'
      `);
      
      const variantColumnNames = variantsColumns.map(col => col.COLUMN_NAME);
      console.log('Columns in product_variants table:', variantColumnNames.join(', '));
      
      // Check if specific columns exist and try to fix any issues
      const requiredVariantColumns = [
        {
          name: 'product_variant_is_bestseller',
          type: 'TINYINT(1)',
          default: '0',
          after: 'product_variant_name'
        },
        {
          name: 'product_variant_is_display',
          type: 'TINYINT(1)',
          default: '1',
          after: 'product_variant_added_date'
        }
      ];
      
      for (const col of requiredVariantColumns) {
        if (!variantColumnNames.includes(col.name)) {
          console.log(`Adding missing column ${col.name} to product_variants table...`);
          try {
            await query(`
              ALTER TABLE product_variants 
              ADD COLUMN ${col.name} ${col.type} NOT NULL DEFAULT ${col.default} 
              AFTER ${col.after}
            `);
            console.log(`Column ${col.name} added successfully`);
          } catch (err) {
            console.error(`Error adding column ${col.name}:`, err);
          }
        } else {
          console.log(`Column ${col.name} already exists`);
        }
      }
      
      console.log('\nDatabase check and fix completed');
      db.end();
    });
    
  } catch (error) {
    console.error('Error in check and fix process:', error);
    process.exit(1);
  }
}

checkAndFixDatabase();
