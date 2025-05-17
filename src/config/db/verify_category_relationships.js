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
            
            // Fix orphaned products
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
        
        // Ensure all categories have a proper type value
        const categoriesWithoutType = categories.filter(cat => !cat.categorry_type);
        if (categoriesWithoutType.length > 0) {
            console.warn(`Found ${categoriesWithoutType.length} categories without a type.`);
            
            // Set a default type
            for (const category of categoriesWithoutType) {
                await query('UPDATE categories SET categorry_type = ? WHERE category_id = ?', 
                    ['Khác', category.category_id]);
                console.log(`Fixed category ID ${category.category_id} with default type 'Khác'`);
            }
            
            console.log('All categories now have a type value.');
        } else {
            console.log('✅ All categories have a type value.');
        }
        
        console.log('Verification complete.');
        
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

// Run the verification and fix function
verifyAndFixRelationships().then(() => {
    console.log('Finished verification process.');
    process.exit(0);
}).catch(err => {
    console.error('Verification process failed:', err);
    process.exit(1);
});
