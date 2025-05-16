const express = require('express')
const router = express.Router()

// import controller
const accountController = require('../controllers/customer/accountController.js')
const authMiddleware = require('../middleware/authMiddleware.js')

// Account dashboard
router.get('/', authMiddleware.isLoggedIn, (req, res) => {
    res.render('account/dashboard', { title: 'Account Dashboard' });
});

// Account profile
router.get('/profile', authMiddleware.isLoggedIn, (req, res) => {
    res.render('account/profile', { title: 'Profile' });
});

// Update profile
router.post('/profile', authMiddleware.isLoggedIn, (req, res) => {
    // Logic to update profile would go here
    res.redirect('/account/profile');
});

// Change password
router.get('/change-password', authMiddleware.isLoggedIn, (req, res) => {
    res.render('account/change-password', { title: 'Change Password' });
});

// Process password change
router.post('/change-password', authMiddleware.isLoggedIn, (req, res) => {
    // Logic to change password would go here
    res.redirect('/account');
});

module.exports = router