const express = require('express');
const router = express.Router();

// Import controller
const authController = require('../controllers/customer/authController.js');

// Authentication routes
router.get('/login', authController.login);
router.post('/login', authController.login_post);
router.get('/register', authController.register);
router.get('/logout', authController.logout);

module.exports = router;