const express = require('express');
const router = express.Router();
const path = require('path');

const adminController = require('../controllers/AdminController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Admin routes
router.get('/login', adminController.login);
router.post('/login', adminController.login_post);
router.get('/logout', adminMiddleware.isAdmin, adminController.logout);

// Dashboard routes
router.get('/', adminMiddleware.isAdmin, adminController.index);

// Category management
router.get('/categories_admin', adminMiddleware.isAdmin, adminController.categories);
router.get('/categories_admin/add', adminMiddleware.isAdmin, adminController.category_add);
router.get('/categories_admin/edit/:id', adminMiddleware.isAdmin, adminController.category_edit);

// Product management
router.get('/products_admin', adminMiddleware.isAdmin, adminController.getProducts);
router.get('/products_admin/add', adminMiddleware.isAdmin, adminController.addProductPage);
router.get('/products_admin/edit/:id', adminMiddleware.isAdmin, adminController.editProductPage);

// Order management
router.get('/orders_admin', adminMiddleware.isAdmin, adminController.orders);
router.get('/orders_admin/:id', adminMiddleware.isAdmin, adminController.order_details);

// User management
router.get('/users_admin', adminMiddleware.isAdmin, adminController.users);

// Category API endpoints
router.post('/api/update-category', adminMiddleware.isAdmin, adminController.updateCategory);
router.get('/api/categories/:id', adminMiddleware.isAdmin, adminController.getCategory);
router.get('/api/categories', adminMiddleware.isAdmin, adminController.getCategories);
router.delete('/api/delete-category/:id', adminMiddleware.isAdmin, adminController.deleteCategory);
router.post('/api/add-category', adminMiddleware.isAdmin, adminController.addCategory);

// Product API endpoints
router.post('/api/add-product', adminMiddleware.isAdmin, adminController.addProduct);
router.post('/api/update-product', adminMiddleware.isAdmin, adminController.updateProduct);
router.delete('/api/delete-product/:id', adminMiddleware.isAdmin, adminController.deleteProduct);
router.post('/api/bulk-delete-products', adminMiddleware.isAdmin, adminController.bulkDeleteProducts);
router.post('/api/update-products-visibility', adminMiddleware.isAdmin, adminController.updateProductsVisibility);

// Order API endpoints
router.post('/api/update-order-status', adminMiddleware.isAdmin, adminController.updateOrderStatus);

module.exports = router;