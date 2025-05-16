const express = require('express')
const router = express.Router()

var parseUrl = require('body-parser')

// import controller
const siteController = require('../controllers/customer/siteController.js')

// import middleware
const authMiddleware = require('../middleware/authMiddleware.js')

router.get('/category', authMiddleware.getLoggedIn, siteController.category)
router.get('/about-us', authMiddleware.getLoggedIn, siteController.aboutUs)
router.get('/privacy-policy', authMiddleware.getLoggedIn, siteController.privacyPolicy)
router.get('/error', authMiddleware.getLoggedIn, siteController.error)
router.get('/feature_development', siteController.development)
router.get('/', authMiddleware.getLoggedIn, siteController.index)

// Home page
router.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

// About page
router.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us' });
});

module.exports = router
