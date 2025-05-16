const db = require('./connect');
const util = require('util');

// Convert db.query to promise-based
const query = util.promisify(db.query).bind(db);

async function updateCategoryRoutes() {
    try {
        // Define the new category names and their corresponding slugs
        const categoryUpdates = [
            { oldName: 'Điện Máy', newName: 'Laptop', newSlug: 'laptop' },
            { oldName: 'Điện tử', newName: 'PC', newSlug: 'pc' },
            { oldName: 'Nhà bếp', newName: 'Linh Kiện', newSlug: 'linh-kien' },
            { oldName: 'Gia dụng', newName: 'Gaming Gear', newSlug: 'gaming-gear' }
        ];

        // Update each category in the database
        for (const update of categoryUpdates) {
            console.log(`Updating category: ${update.oldName} -> ${update.newName}`);
            
            // Update the category name and slug in the database
            await query(
                'UPDATE categories SET category_name = ?, category_slug = ? WHERE category_name = ?', 
                [update.newName, update.newSlug, update.oldName]
            );
            
            console.log(`Updated ${update.oldName} to ${update.newName} with slug ${update.newSlug}`);
        }
        
        console.log('Category routes updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating category routes:', error);
        process.exit(1);
    }
}

updateCategoryRoutes();
