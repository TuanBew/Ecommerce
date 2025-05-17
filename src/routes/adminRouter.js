const express = require('express');
const router = express.Router();
const path = require('path');

const adminController = require('../controllers/AdminController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Add debug middleware to log route access
router.use((req, res, next) => {
    console.log(`[ADMIN ROUTE] Accessing: ${req.method} ${req.originalUrl}`);
    next();
});

// Admin routes
router.get('/login', adminController.login);
router.post('/login', adminController.login_post);
router.get('/logout', adminMiddleware.isAdmin, adminController.logout);

// Dashboard routes
router.get('/', adminMiddleware.isAdmin, adminController.index);

// Category management - with both URL patterns for compatibility
router.get('/categories_admin', adminMiddleware.isAdmin, adminController.categories);
router.get('/category_admin', adminMiddleware.isAdmin, adminController.categories); // Alias route

router.get('/categories_admin/add', adminMiddleware.isAdmin, adminController.category_add);
router.get('/category_add_admin', adminMiddleware.isAdmin, adminController.category_add); // Alias route

router.get('/categories_admin/edit/:id', adminMiddleware.isAdmin, adminController.category_edit);
router.get('/category_edit_admin/:id', adminMiddleware.isAdmin, adminController.category_edit); // Alias route

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
router.post('/categories_admin/update/:id', adminMiddleware.isAdmin, adminController.updateCategory); // Add structured endpoint
router.post('/category_edit_admin/:id', adminMiddleware.isAdmin, adminController.updateCategory); // Alias route

// Product API endpoints
router.post('/api/add-product', adminMiddleware.isAdmin, adminController.addProduct);
router.post('/api/update-product', adminMiddleware.isAdmin, adminController.updateProduct);
router.delete('/api/delete-product/:id', adminMiddleware.isAdmin, adminController.deleteProduct);
router.post('/api/bulk-delete-products', adminMiddleware.isAdmin, adminController.bulkDeleteProducts);
router.post('/api/update-products-visibility', adminMiddleware.isAdmin, adminController.updateProductsVisibility);

// Order API endpoints
router.post('/api/update-order-status', adminMiddleware.isAdmin, adminController.updateOrderStatus);

module.exports = router;