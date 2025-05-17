/**
 * Middleware to log all route requests with detailed information
 */
const routeLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log('\n[ROUTE ACCESS]', timestamp);
    console.log(`${req.method} ${req.originalUrl}`);
    console.log('Headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'user-agent': req.headers['user-agent']
    });
    
    if (Object.keys(req.params).length > 0) {
        console.log('URL Params:', req.params);
    }
    
    if (Object.keys(req.query).length > 0) {
        console.log('Query Params:', req.query);
    }
    
    if (req.files) {
        console.log('Files:', Object.keys(req.files).map(key => ({
            name: key,
            originalName: req.files[key].name,
            size: `${(req.files[key].size / 1024).toFixed(2)} KB`,
            mimetype: req.files[key].mimetype
        })));
    }
    
    // Add response logging
    const oldSend = res.send;
    res.send = function(data) {
        console.log(`[RESPONSE] ${res.statusCode}`);
        // Execute the original function
        oldSend.apply(res, arguments);
    };
    
    next();
};

module.exports = routeLogger;
