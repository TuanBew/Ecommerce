const express = require('express')
const router = express.Router()

const categoryController = require('../controllers/CategoryController')

// Category routes
router.get('/:id', categoryController.getCategory)
router.get('/', categoryController.getAllCategories)

module.exports = router
