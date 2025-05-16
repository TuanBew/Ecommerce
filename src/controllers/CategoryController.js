const util = require('util')
const db = require('../config/db/connect')
const query = util.promisify(db.query).bind(db)

class CategoryController {
  // Get all categories
  getAllCategories = async (req, res) => {
    try {
      const categories = await query('SELECT * FROM categories ORDER BY category_name ASC')
      
      res.render('client/pages/categories', {
        title: {
          title: 'Danh mục sản phẩm'
        },
        categories
      })
    } catch (error) {
      console.error('Error fetching categories:', error)
      res.status(500).send('Đã xảy ra lỗi khi lấy dữ liệu danh mục')
    }
  }

  // Get products from a specific category
  getCategory = async (req, res) => {
    try {
      const categoryId = req.params.id
      
      // Get category info
      const categoryInfo = await query('SELECT * FROM categories WHERE category_id = ?', [categoryId])
      
      if (categoryInfo.length === 0) {
        return res.redirect('/404')
      }
      
      // Get products in this category
      const products = await query(`
        SELECT p.*, 
          (SELECT pi.image_name FROM product_images pi WHERE pi.product_id = p.product_id LIMIT 1) as image_name 
        FROM products p
        WHERE p.category_id = ?
        ORDER BY p.product_id DESC
      `, [categoryId])
      
      res.render('client/pages/category', {
        title: {
          title: categoryInfo[0].category_name
        },
        category: categoryInfo[0],
        products
      })
    } catch (error) {
      console.error('Error fetching category products:', error)
      res.status(500).send('Đã xảy ra lỗi khi lấy dữ liệu sản phẩm')
    }
  }
}

module.exports = new CategoryController()
