const db = require('./connect');
const util = require('util');

// Convert db.query to promise-based
const query = util.promisify(db.query).bind(db);

async function verifyAndFixRelationships() {
    try {
        console.log('Verifying category relationships...');
        
        // Get all categories and products
        const categories = await query('SELECT * FROM categories');
        const products = await query('SELECT * FROM products');
        
        console.log(`Found ${categories.length} categories and ${products.length} products.`);
        
        // Check for products with missing categories
        const categoryIds = categories.map(cat => cat.category_id);
        const orphanedProducts = products.filter(product => !categoryIds.includes(product.category_id));
        
        if (orphanedProducts.length > 0) {
            console.warn(`Found ${orphanedProducts.length} products with invalid category references.`);
            console.log('Product IDs with issues:', orphanedProducts.map(p => p.product_id));
            
            // Prompt for auto-fix (in a real scenario, you'd add user interaction here)
            // For now, we'll assign these products to the first category (just as an example)
            if (categories.length > 0) {
                const defaultCategory = categories[0].category_id;
                console.log(`Assigning orphaned products to category ID: ${defaultCategory}`);
                
                for (const product of orphanedProducts) {
                    await query('UPDATE products SET category_id = ? WHERE product_id = ?', 
                        [defaultCategory, product.product_id]);
                    console.log(`Fixed product ID: ${product.product_id}`);
                }
                
                console.log('All orphaned products have been reassigned.');
            } else {
                console.error('Cannot fix orphaned products: No categories available.');
            }
        } else {
            console.log('✅ All products have valid category references.');
        }
        
        // Check for any subcategories if applicable
        try {
            const subcategories = await query('SELECT * FROM subcategories');
            if (subcategories.length > 0) {
                const orphanedSubcategories = subcategories.filter(sub => !categoryIds.includes(sub.category_id));
                
                if (orphanedSubcategories.length > 0) {
                    console.warn(`Found ${orphanedSubcategories.length} subcategories with invalid category references.`);
                    // Add your fix logic here if needed
                } else {
                    console.log('✅ All subcategories have valid category references.');
                }
            }
        } catch (e) {
            // Subcategories table might not exist, which is fine
            console.log('No subcategories table found. Skipping check.');
        }
        
        console.log('Verification complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    }
}

verifyAndFixRelationships();
