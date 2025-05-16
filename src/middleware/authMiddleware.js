const jwt = require('jsonwebtoken');
const util = require('util');
const db = require('../config/db/connect');
const query = util.promisify(db.query).bind(db);

const authMiddleware = function () { };

// Check if user is logged in and redirect to login if not
authMiddleware.isLoggedIn = async (req, res, next) => {
    try {
        if (!req.cookies.jwt) {
            return res.redirect('/auth/login');
        }

        const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
        
        // Check if user exists
        const users = await query(`
            SELECT u.*, c.customer_id
            FROM users u
            LEFT JOIN customers c ON u.user_id = c.user_id
            WHERE u.user_id = ? AND u.role_id = 2
        `, [decoded.user_id]);
        
        if (users.length === 0) {
            res.clearCookie('jwt', { path: '/' });
            return res.redirect('/auth/login');
        }
        
        // User is authenticated
        req.user = users[0];
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.clearCookie('jwt', { path: '/' });
        res.redirect('/auth/login');
    }
};

// Check if user is logged in but don't redirect (for optional authentication)
authMiddleware.getLoggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
            
            const users = await query(`
                SELECT u.*, c.customer_id
                FROM users u
                LEFT JOIN customers c ON u.user_id = c.user_id
                WHERE u.user_id = ?
            `, [decoded.user_id]);
            
            if (users.length > 0) {
                req.user = users[0];
            }
        }
        
        next();
    } catch (error) {
        console.error("getLoggedIn middleware error:", error);
        req.user = null;
        next();
    }
};

module.exports = authMiddleware;