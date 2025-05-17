const db = require('../config/db/connect');
const jwt = require('jsonwebtoken');
const util = require('util');
const query = util.promisify(db.query).bind(db);

exports.isAdmin = async (req, res, next) => {
    console.log("[ADMIN MIDDLEWARE] Checking admin authentication");
    
    try {
        // Debug cookie data
        console.log("[ADMIN MIDDLEWARE] Cookies:", req.cookies ? Object.keys(req.cookies) : 'No cookies');
        
        // Check if cookie exists
        if (!req.cookies || !req.cookies.adminSave) {
            console.log("[ADMIN MIDDLEWARE] No admin cookie found, redirecting to login");
            return res.redirect('/admin/login');
        }

        const token = req.cookies.adminSave;
        
        // Debug token
        console.log("[ADMIN MIDDLEWARE] Token found:", token.substring(0, 10) + '...');
        
        try {
            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("[ADMIN MIDDLEWARE] Decoded token:", decoded);

            // Get admin from database
            const admin = await query('SELECT * FROM admin WHERE admin_id = ?', [decoded.admin_id]);

            if (admin.length === 0) {
                console.log("[ADMIN MIDDLEWARE] Admin not found in database");
                res.clearCookie('adminSave');
                return res.redirect('/admin/login');
            }

            console.log("[ADMIN MIDDLEWARE] Auth successful for:", admin[0].admin_login_name);
            req.admin = admin[0];
            next();
        } catch (err) {
            console.log("[ADMIN MIDDLEWARE] Token verification failed:", err.message);
            res.clearCookie('adminSave');
            return res.redirect('/admin/login');
        }
    } catch (error) {
        console.error("[ADMIN MIDDLEWARE] Error in auth middleware:", error);
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
