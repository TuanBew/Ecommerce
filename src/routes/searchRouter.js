const express = require('express')
const router = express.Router();

// import controller
const searchController = require('../controllers/customer/searchController.js')

// import middleware
const authMiddleware = require('../middleware/authMiddleware.js')

// Search results
router.get('/', (req, res) => {
    const query = req.query.q || '';
    res.render('search', { title: 'Search Results', query: query });
});

// Advanced search
router.get('/advanced', (req, res) => {
    res.render('search/advanced', { title: 'Advanced Search' });
});

router.get('/results',authMiddleware.getLoggedIn, searchController.results)
router.get('/:product_variant_id', authMiddleware.getLoggedIn, searchController.detail)

module.exports = router