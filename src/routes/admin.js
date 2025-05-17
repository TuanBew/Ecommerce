const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { requireAuth } = require('../middlewares/AuthMiddleware');

// Debug middleware for routes
const routeLogger = require('../middlewares/routeLogger');
const debugUploadMiddleware = require('../middlewares/debugUploadMiddleware');

// Apply middlewares
router.use(routeLogger);
router.use(debugUploadMiddleware);

// Dashboard routes
router.get('/', requireAuth, AdminController.index);

// Auth routes
router.get('/login', AdminController.login);
router.post('/login', AdminController.login_post);
router.get('/logout', AdminController.logout);

// Category routes
router.get('/categories_admin', requireAuth, AdminController.categories);
router.get('/categories_admin/add', requireAuth, AdminController.category_add);
router.get('/categories_admin/edit/:id', requireAuth, AdminController.category_edit);
router.post('/categories_admin/update', requireAuth, AdminController.updateCategory);
router.delete('/categories_admin/delete/:id', requireAuth, AdminController.deleteCategory);
router.post('/categories_admin/add', requireAuth, AdminController.addCategory);

// Product routes
router.get('/products_admin', requireAuth, AdminController.getProducts);
router.get('/products_admin/add', requireAuth, AdminController.addProductPage);
router.get('/products_admin/edit/:id', requireAuth, AdminController.editProductPage);
router.post('/products_admin/add', requireAuth, AdminController.addProduct);
router.post('/products_admin/update/:id', requireAuth, AdminController.updateProduct);
router.post('/products_admin/update', requireAuth, (req, res) => {
    const productId = req.body.product_id;
    if (productId) {
        console.log(`[PRODUCT UPDATE ROUTE] Redirecting to proper URL format with ID: ${productId}`);
        res.redirect(307, `/admin/products_admin/update/${productId}`);
    } else {
        res.status(400).json({
            status: 'error',
            message: 'Missing product ID'
        });
    }
});
router.delete('/products_admin/delete/:id', requireAuth, AdminController.deleteProduct);
router.post('/products_admin/bulk-delete', requireAuth, AdminController.bulkDeleteProducts);
router.post('/products_admin/update-visibility', requireAuth, AdminController.updateProductsVisibility);

// Order routes
router.get('/orders_admin', requireAuth, AdminController.orders);
router.get('/orders_admin/:id', requireAuth, AdminController.order_details);
router.post('/orders_admin/update-status', requireAuth, AdminController.updateOrderStatus);

// User routes
router.get('/users_admin', requireAuth, AdminController.users);

// Category tool
router.get('/category_update_tool', requireAuth, AdminController.category_update_tool);

// API routes
router.get('/api/categories', requireAuth, AdminController.getCategories);
router.get('/api/categories/:id', requireAuth, AdminController.getCategory);

module.exports = router;
