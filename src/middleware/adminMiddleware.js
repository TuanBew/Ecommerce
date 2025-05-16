const db = require('../config/db/connect');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

exports.isAdmin = async (req, res, next) => {
    console.log('[ADMIN MIDDLEWARE] Checking admin authentication');
    
    if (req.cookies.adminSave) {
        try {
            // Verify token
            const decoded = await promisify(jwt.verify)(req.cookies.adminSave, process.env.JWT_SECRET);
            console.log('[ADMIN MIDDLEWARE] Decoded token:', decoded);
            
            // Find admin using admin_id from token
            db.query('SELECT * FROM admin WHERE admin_id = ?', [decoded.admin_id], (err, results) => {
                if (err) {
                    console.log('[ADMIN MIDDLEWARE] DB error:', err);
                    return res.redirect('/admin/login');
                }
                
                if (results.length === 0) {
                    console.log('[ADMIN MIDDLEWARE] Admin not found');
                    res.clearCookie('adminSave');
                    return res.redirect('/admin/login');
                }
                
                // Admin exists, store in request for use in controllers
                req.admin = results[0]; 
                req.user = results[0]; // For compatibility with templates that expect user
                console.log('[ADMIN MIDDLEWARE] Auth successful for:', req.admin.admin_login_name);
                return next();
            });
        } catch (err) {
            console.log('[ADMIN MIDDLEWARE] Token verification error:', err);
            res.clearCookie('adminSave');
            return res.redirect('/admin/login');
        }
    } else {
        console.log('[ADMIN MIDDLEWARE] No cookie found, redirecting to login');
        return res.redirect('/admin/login');
    }
};

// Check if user is logged in, redirect if already logged in
exports.checkAuth = (req, res, next) => {
    if (req.cookies.adminSave) {
        return res.redirect('/admin');
    }
    next();
};
