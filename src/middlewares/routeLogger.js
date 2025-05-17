/**
 * Middleware to log detailed route information for debugging
 */
const routeLogger = (req, res, next) => {
    console.log('\n[ROUTE LOG] =====================================');
    console.log(`[ROUTE LOG] ${new Date().toISOString()}`);
    console.log(`[ROUTE LOG] ${req.method} ${req.originalUrl}`);
    
    if (Object.keys(req.params).length > 0) {
        console.log('[ROUTE LOG] URL Params:', req.params);
    }
    
    // Log only keys for body to avoid sensitive info
    if (Object.keys(req.body).length > 0) {
        console.log('[ROUTE LOG] Body Keys:', Object.keys(req.body));
    }
    
    if (req.files) {
        console.log('[ROUTE LOG] Files:', Object.keys(req.files).map(key => ({
            fieldName: key,
            fileName: req.files[key].name,
            size: (req.files[key].size / 1024).toFixed(2) + 'KB'
        })));
    }
    
    // Log the response status
    const originalEnd = res.end;
    res.end = function() {
        console.log(`[ROUTE LOG] Response Status: ${res.statusCode}`);
        console.log('[ROUTE LOG] =====================================\n');
        originalEnd.apply(res, arguments);
    };
    
    next();
};

module.exports = routeLogger;
