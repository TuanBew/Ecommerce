const express = require('express')
const router = express.Router()
const path = require('path')

const adminController = require('../controllers/AdminController')

// Middleware to verify admin access
const adminMiddleware = require('../middlewares/AdminMiddleware')

// Admin Dashboard
router.get('/', adminMiddleware.isAdmin, adminController.index)

// Admin login
router.get('/login', adminController.login)
router.post('/login', adminController.login_post)

// Admin logout
router.get('/logout', adminController.logout)

// Categories Manager
router.get('/categories_admin', adminMiddleware.isAdmin, adminController.categories)
router.get('/category_add_admin', adminMiddleware.isAdmin, adminController.category_add)
router.get('/category_edit_admin/:id', adminMiddleware.isAdmin, adminController.category_edit)

// Category Update Tool
router.get('/category-update-tool', adminMiddleware.isAdmin, adminController.category_update_tool)

// Category Update API
router.post('/api/update-category', adminMiddleware.isAdmin, adminController.updateCategory)
router.delete('/api/delete-category/:id', adminMiddleware.isAdmin, adminController.deleteCategory)
router.post('/api/add-category', adminMiddleware.isAdmin, adminController.addCategory)

// Category API
router.get('/api/categories', adminMiddleware.isAdmin, adminController.getCategories)
router.get('/api/categories/:id', adminMiddleware.isAdmin, adminController.getCategory)

// Products Manager
router.get('/products_admin', adminMiddleware.isAdmin, adminController.products)
router.get('/product_add_admin', adminMiddleware.isAdmin, adminController.product_add)
router.get('/product_edit_admin/:id', adminMiddleware.isAdmin, adminController.product_edit)

// Product Update API
router.post('/api/update-product', adminMiddleware.isAdmin, adminController.updateProduct)
router.delete('/api/delete-product/:id', adminMiddleware.isAdmin, adminController.deleteProduct)
router.post('/api/add-product', adminMiddleware.isAdmin, adminController.addProduct)

// Orders Manager
router.get('/orders_admin', adminMiddleware.isAdmin, adminController.orders)
router.get('/order_details_admin/:id', adminMiddleware.isAdmin, adminController.order_details)

// Order Update API
router.post('/api/update-order-status', adminMiddleware.isAdmin, adminController.updateOrderStatus)

// Users Manager
router.get('/users_admin', adminMiddleware.isAdmin, adminController.users)

// Admin dashboard
router.get('/', (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

// Products management
router.get('/products', (req, res) => {
    res.render('admin/products', { title: 'Manage Products' });
});

// Add product form
router.get('/products/add', (req, res) => {
    res.render('admin/product-form', { title: 'Add Product' });
});

// User management
router.get('/users', (req, res) => {
    res.render('admin/users', { title: 'Manage Users' });
});

// Order management
router.get('/orders', (req, res) => {
    res.render('admin/orders', { title: 'Manage Orders' });
});

// Reports
router.get('/reports', (req, res) => {
    res.render('admin/reports', { title: 'Reports' });
});

module.exports = router