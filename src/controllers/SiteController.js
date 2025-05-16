// Add this to your existing SiteController to make sure it displays the updated category types:

// Add to the "index" method to ensure it passes the correct category types
index = async(req, res) => {
    // ... existing code ...
    
    // Get all category types
    const categoryTypes = await query('SELECT DISTINCT categorry_type FROM categories');
    
    // ... existing code ...
    
    res.render('site/pages/index', {
        // ... existing code ...
        categoryTypes: categoryTypes.map(item => item.categorry_type),
        // ... existing code ...
    });
}
