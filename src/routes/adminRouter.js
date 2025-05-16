const express = require('express');
const router = express.Router();
const path = require('path');

const adminController = require('../controllers/AdminController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes - no auth required
router.get('/login', adminMiddleware.checkAuth, adminController.login);
router.post('/login', adminController.login_post);
router.get('/logout', (req, res) => {
    res.clearCookie('adminSave');
    res.redirect('/admin/login');
});

// Protected routes - require admin authentication
router.get('/', adminMiddleware.isAdmin, adminController.index);
router.get('/dashboard', adminMiddleware.isAdmin, adminController.index);

// Categories Manager
router.get('/categories_admin', adminMiddleware.isAdmin, adminController.categories);
router.get('/category_add_admin', adminMiddleware.isAdmin, adminController.category_add);
router.get('/category_edit_admin/:id', adminMiddleware.isAdmin, adminController.category_edit);
router.get('/category-update-tool', adminMiddleware.isAdmin, adminController.category_update_tool);

// Category API endpoints
router.post('/api/update-category', adminMiddleware.isAdmin, adminController.updateCategory);
router.get('/api/categories/:id', adminMiddleware.isAdmin, adminController.getCategory);
router.get('/api/categories', adminMiddleware.isAdmin, adminController.getCategories);
router.delete('/api/delete-category/:id', adminMiddleware.isAdmin, adminController.deleteCategory);
router.post('/api/add-category', adminMiddleware.isAdmin, adminController.addCategory);

// Products Manager
router.get('/products_admin', adminMiddleware.isAdmin, adminController.products);
router.get('/product_add_admin', adminMiddleware.isAdmin, adminController.product_add);
router.get('/product_edit_admin/:id', adminMiddleware.isAdmin, adminController.product_edit);

// Product Update API
router.post('/api/update-product', adminMiddleware.isAdmin, adminController.updateProduct);
router.delete('/api/delete-product/:id', adminMiddleware.isAdmin, adminController.deleteProduct);
router.post('/api/add-product', adminMiddleware.isAdmin, adminController.addProduct);

// Orders Manager
router.get('/orders_admin', adminMiddleware.isAdmin, adminController.orders);
router.get('/order_details_admin/:id', adminMiddleware.isAdmin, adminController.order_details);

// Order Update API
router.post('/api/update-order-status', adminMiddleware.isAdmin, adminController.updateOrderStatus);

// Users Manager
router.get('/users_admin', adminMiddleware.isAdmin, adminController.users);

// Admin dashboard
router.get('/', adminMiddleware.isAdmin, (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

// Products management
router.get('/products', adminMiddleware.isAdmin, (req, res) => {
    res.render('admin/products', { title: 'Manage Products' });
});

// Add product form
router.get('/products/add', adminMiddleware.isAdmin, (req, res) => {
    res.render('admin/product-form', { title: 'Add Product' });
});

// User management
router.get('/users', adminMiddleware.isAdmin, (req, res) => {
    res.render('admin/users', { title: 'Manage Users' });
});

// Order management
router.get('/orders', adminMiddleware.isAdmin, (req, res) => {
    res.render('admin/orders', { title: 'Manage Orders' });
});

// Reports
router.get('/reports', adminMiddleware.isAdmin, (req, res) => {
    res.render('admin/reports', { title: 'Reports' });
});

module.exports = router;