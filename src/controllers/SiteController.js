// Add this to your existing SiteController to make sure it displays the updated category types:

// Update index method to ensure proper category data is passed
index = async(req, res) => {
    try {
        // Get data for header
        const headerData = await index.header(req)
        
        // Get user data if logged in
        const userData = req.user ? await index.header_user(req) : 0

        // Get categories with proper structure
        const categories = await query(`
            SELECT 
                category_id, 
                category_name, 
                category_img, 
                categorry_type,
                (SELECT COUNT(*) FROM products WHERE products.category_id = categories.category_id) as category_count
            FROM categories 
            WHERE category_is_display = 1
            ORDER BY category_name ASC
        `);
        
        // Get featured products
        // ... existing featured products code ...
        
        // Log for debugging
        console.log("[SITE] Categories loaded:", categories.length);
        
        res.render('pages/site/index', {
            title: {
                title: 'TECHTWO.'
            },
            header: headerData,
            userData,
            categories,
            // ... other existing data ...
        });
    } catch (error) {
        console.error("Error in site index:", error);
        res.status(500).send("Internal Server Error");
    }
}
