const jwt = require('jsonwebtoken')
const util = require('util');
const db = require('../config/db/connect')
const query = util.promisify(db.query).bind(db);

class AdminMiddleware {
  // Check if user is logged in as admin
  isAdmin = async (req, res, next) => {
    try {
      // Check if JWT exists in cookies
      const token = req.cookies.jwt;
      if (!token) {
        return res.redirect('/admin/login');
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user exists and is an admin
      const user = await query('SELECT * FROM users WHERE user_id = ?', [decoded.user_id]);
      
      if (user.length === 0 || user[0].role_id !== 1) {
        return res.redirect('/admin/login');
      }

      // User is authenticated and is an admin
      req.user = user[0];
      next();
    } catch (error) {
      console.error('Admin authentication error:', error);
      res.redirect('/admin/login');
    }
  }
}

module.exports = new AdminMiddleware();
