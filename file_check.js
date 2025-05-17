const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const dotenv = require('dotenv').config();
const util = require('util');

// Create database connection
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

// Promisify database queries
const query = util.promisify(db.query).bind(db);

async function checkProductImages() {
  try {
    console.log('Checking product images consistency between database and file system...');
    
    // Connect to database
    db.connect();
    
    // Get all product images from database
    const dbImages = await query('SELECT product_id, image_id, image_name FROM product_imgs ORDER BY product_id');
    console.log(`Found ${dbImages.length} images in database`);
    
    // Base directory for product images
    const baseDir = path.join(__dirname, 'src', 'public', 'imgs', 'product_image');
    
    if (!fs.existsSync(baseDir)) {
      console.error(`ERROR: Base directory does not exist: ${baseDir}`);
      return;
    }
    
    // Group images by product
    const imagesByProduct = {};
    for (const img of dbImages) {
      if (!imagesByProduct[img.product_id]) {
        imagesByProduct[img.product_id] = [];
      }
      imagesByProduct[img.product_id].push(img);
    }
    
    // Check each product's image directory
    let missingFiles = 0;
    let missingDirs = 0;
    let existingFiles = 0;
    
    for (const productId in imagesByProduct) {
      const productDir = path.join(baseDir, `P${productId}`);
      
      // Check if product directory exists
      if (!fs.existsSync(productDir)) {
        console.error(`ERROR: Directory for product ID ${productId} does not exist: ${productDir}`);
        missingDirs++;
        
        // Create directory
        console.log(`Creating directory: ${productDir}`);
        fs.mkdirSync(productDir, { recursive: true });
        
        continue;
      }
      
      // Check each image file
      for (const img of imagesByProduct[productId]) {
        const imagePath = path.join(productDir, img.image_name);
        
        if (!fs.existsSync(imagePath)) {
          console.error(`ERROR: Image file does not exist: ${imagePath} (ID: ${img.image_id})`);
          missingFiles++;
        } else {
          existingFiles++;
        }
      }
    }
    
    console.log('\nSummary:');
    console.log(`- Total images in database: ${dbImages.length}`);
    console.log(`- Existing image files found: ${existingFiles}`);
    console.log(`- Missing image files: ${missingFiles}`);
    console.log(`- Missing directories: ${missingDirs}`);
    
    // Close database connection
    db.end();
    
  } catch (error) {
    console.error('Error checking product images:', error);
    db.end();
  }
}

checkProductImages();
