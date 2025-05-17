const express = require('express')
const router = express.Router()
const AdminController = require('../controllers/AdminController')
const { requireAuth } = require('../middlewares/adminAuth')
const routeLogger = require('../middlewares/routeLogger')

// Apply route logger middleware to all admin routes
router.use(routeLogger);

// Basic routes
router.get('/', requireAuth, AdminController.index)
router.get('/login', AdminController.login)
router.post('/login', AdminController.login_post)
router.get('/logout', requireAuth, AdminController.logout)

// Product routes
router.get('/products_admin', requireAuth, AdminController.getProducts)
router.get('/products_admin/add', requireAuth, AdminController.addProductPage)
router.post('/products_admin/add', requireAuth, AdminController.addProduct)
router.get('/products_admin/edit/:id', requireAuth, AdminController.editProductPage)

// Define the update product route with explicit logging
router.post('/products_admin/update/:id', requireAuth, (req, res, next) => {
    console.log("[ROUTE DEBUG] Update product route hit");
    console.log("[ROUTE DEBUG] Product ID:", req.params.id);
    console.log("[ROUTE DEBUG] Request body contains:", Object.keys(req.body));
    if (req.files) {
        console.log("[ROUTE DEBUG] Files received:", Object.keys(req.files));
    }
    next();
}, AdminController.updateProduct);

// Fallback route for when ID is in the body instead of URL params
router.post('/products_admin/update', requireAuth, (req, res, next) => {
    console.log("[ROUTE DEBUG] Fallback update route hit");
    next();
}, AdminController.updateProduct);

router.delete('/products_admin/delete/:id', requireAuth, AdminController.deleteProduct)
router.post('/products_admin/bulk-delete', requireAuth, AdminController.bulkDeleteProducts)
router.post('/products_admin/update-visibility', requireAuth, AdminController.updateProductsVisibility)

// Category routes
router.get('/categories_admin', requireAuth, AdminController.categories)
router.get('/categories_admin/add', requireAuth, AdminController.category_add)
router.post('/categories_admin/add', requireAuth, AdminController.addCategory)
router.get('/categories_admin/edit/:id', requireAuth, AdminController.category_edit)
router.post('/categories_admin/update/:id', requireAuth, AdminController.updateCategory)
router.delete('/categories_admin/delete/:id', requireAuth, AdminController.deleteCategory)
router.get('/categories_admin/update-tool', requireAuth, AdminController.category_update_tool)
router.get('/api/categories', requireAuth, AdminController.getCategories)
router.get('/api/categories/:id', requireAuth, AdminController.getCategory)

// Other routes
router.get('/users_admin', requireAuth, AdminController.users)
router.get('/orders_admin', requireAuth, AdminController.orders)
router.get('/orders_admin/:id', requireAuth, AdminController.order_details)

module.exports = router
