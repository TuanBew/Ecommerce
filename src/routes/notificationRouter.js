const express = require('express');
const router = express.Router();

// import controller
const notificationController = require('../controllers/customer/notificationController.js');

// import middleware
const authMiddleware = require('../middleware/authMiddleware.js');

router.get('/order', authMiddleware.isLoggedIn, notificationController.order);
router.get('/promotion', authMiddleware.isLoggedIn, notificationController.promotion);

router.post('/read-noti', authMiddleware.isLoggedIn, notificationController.readNotification);
router.post('/read-all', authMiddleware.isLoggedIn, notificationController.readAllNotifications);

// Get all notifications
router.get('/', (req, res) => {
    res.render('notifications/index', { title: 'Notifications' });
});

// Mark notification as read
router.post('/read/:id', (req, res) => {
    const notificationId = req.params.id;
    // Logic to mark notification as read would go here
    res.json({ success: true });
});

// Mark all notifications as read
router.post('/read-all', (req, res) => {
    // Logic to mark all notifications as read would go here
    res.json({ success: true });
});

module.exports = router;