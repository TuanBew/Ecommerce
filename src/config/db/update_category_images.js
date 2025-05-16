const fs = require('fs');
const path = require('path');
const db = require('./connect');
const util = require('util');

// Convert db.query to promise-based
const query = util.promisify(db.query).bind(db);

async function updateCategoryImages() {
    try {
        // Get all categories
        const categories = await query('SELECT * FROM categories');
        
        // For each category, check if we need to update the image
        for (const category of categories) {
            console.log(`Processing category: ${category.category_name} (ID: ${category.category_id})`);
            
            // The images directory
            const imagesDir = path.join(__dirname, '../../public/imgs/categories');
            
            if (category.category_img) {
                const oldImagePath = path.join(imagesDir, category.category_img);
                
                // Create a new image name based on the new category name
                const fileExtension = path.extname(category.category_img);
                const newImageName = `category_${category.category_id}_${category.category_name.toLowerCase().replace(/\s+/g, '_')}${fileExtension}`;
                const newImagePath = path.join(imagesDir, newImageName);
                
                // If the old image exists and the paths are different, rename it
                if (fs.existsSync(oldImagePath) && oldImagePath !== newImagePath) {
                    try {
                        fs.renameSync(oldImagePath, newImagePath);
                        // Update the database record with the new image name
                        await query('UPDATE categories SET category_img = ? WHERE category_id = ?', 
                            [newImageName, category.category_id]);
                        console.log(`Updated image for category ${category.category_name} from ${category.category_img} to ${newImageName}`);
                    } catch (err) {
                        console.error(`Error renaming image for category ${category.category_name}:`, err);
                    }
                }
            }
        }
        
        console.log('Category images updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating category images:', error);
        process.exit(1);
    }
}

updateCategoryImages();
