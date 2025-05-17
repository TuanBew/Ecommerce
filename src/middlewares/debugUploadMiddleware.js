/**
 * Debug middleware for file uploads to diagnose issues with express-fileupload
 */
const debugUploadMiddleware = (req, res, next) => {
    // Only log for POST requests with multipart/form-data content type
    if (req.method === 'POST' && 
        req.headers['content-type'] && 
        req.headers['content-type'].includes('multipart/form-data')) {
        
        console.log('\n[FILE-UPLOAD] =========================================');
        console.log(`[FILE-UPLOAD] ${new Date().toISOString()}`);
        console.log(`[FILE-UPLOAD] Request URL: ${req.originalUrl}`);
        console.log(`[FILE-UPLOAD] Content-Type: ${req.headers['content-type']}`);
        
        // Add interceptor for file uploads
        const originalFileUpload = req.files;
        
        // Add response end tracking
        const originalEnd = res.end;
        res.end = function() {
            console.log(`[FILE-UPLOAD] Response status: ${res.statusCode}`);
            console.log('[FILE-UPLOAD] =========================================\n');
            originalEnd.apply(this, arguments);
        };
    }
    
    next();
};

module.exports = debugUploadMiddleware;
