const express = require('express');
const router = express.Router();

// Import controller
const accountController = require('../controllers/customer/accountController.js');

// Import middleware
const authMiddleware = require('../middleware/authMiddleware.js');

// Account routes
router.get('/information', authMiddleware.isLoggedIn, accountController.information);
router.post('/information', authMiddleware.isLoggedIn, accountController.updateInformation);

router.get('/purchase', authMiddleware.isLoggedIn, accountController.purchase);
router.get('/purchase/:id', authMiddleware.isLoggedIn, accountController.purchaseDetail);

router.get('/address', authMiddleware.isLoggedIn, accountController.address);
router.post('/address', authMiddleware.isLoggedIn, accountController.updateAddress);

router.get('/password', authMiddleware.isLoggedIn, accountController.password);
router.post('/password', authMiddleware.isLoggedIn, accountController.updatePassword);

module.exports = router;