const express = require("express");
const router = express.Router();

// import controller
const orderController = require('../controllers/customer/orderController.js')
const authMiddleware = require('../middleware/authMiddleware.js')

// Customer routes
router.get('/cart', authMiddleware.isLoggedIn, orderController.cart)
router.post('/cart/delete', authMiddleware.isLoggedIn, orderController.deleteCart)
router.post('/addCart', authMiddleware.getLoggedIn, orderController.addCart)
router.post('/updateCart', authMiddleware.getLoggedIn, orderController.updateCart)

router.get('/information', authMiddleware.isLoggedIn, orderController.information)
router.post('/information', authMiddleware.isLoggedIn, orderController.informationPost)

router.get('/payment', authMiddleware.isLoggedIn, orderController.payment)
router.post('/cancel_order', authMiddleware.isLoggedIn, orderController.cancelOrder)

// Order history
router.get('/', (req, res) => {
    res.render('orders/index', { title: 'Orders' });
});

// Order details
router.get('/:id', (req, res) => {
    const orderId = req.params.id;
    res.render('orders/detail', { title: `Order #${orderId}`, orderId });
});

// Place order
router.post('/place', (req, res) => {
    // Logic for placing an order would go here
    res.redirect('/order/confirmation');
});

// Order confirmation
router.get('/confirmation', (req, res) => {
    res.render('orders/confirmation', { title: 'Order Confirmed' });
});

module.exports = router;
