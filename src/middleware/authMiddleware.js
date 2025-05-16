const jwt = require('jsonwebtoken');
const util = require('util');
const db = require('../config/db/connect');
const query = util.promisify(db.query).bind(db);

const authMiddleware = {};

// Middleware for pages that require login
authMiddleware.isLoggedIn = async (req, res, next) => {
    try {
        if (!req.cookies.jwt) {
            return res.redirect('/auth/login');
        }

        const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

        // Accept both admin and customer roles
        const users = await query(
            `SELECT u.*, c.customer_id
             FROM users u
             LEFT JOIN customers c ON u.user_id = c.user_id
             WHERE u.user_id = ?`,
            [decoded.user_id]
        );

        if (users.length === 0) {
            res.clearCookie('jwt', { path: '/' });
            return res.redirect('/auth/login');
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.clearCookie('jwt', { path: '/' });
        res.redirect('/auth/login');
    }
};

// Middleware for pages that can be accessed by both logged in and not logged in users
authMiddleware.getLoggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

            const users = await query(
                `SELECT u.*, c.customer_id
                 FROM users u
                 LEFT JOIN customers c ON u.user_id = c.user_id
                 WHERE u.user_id = ?`,
                [decoded.user_id]
            );

            if (users.length > 0) {
                req.user = users[0];
            }
        }
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = authMiddleware;