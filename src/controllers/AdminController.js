const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const util = require('util')
const path = require('path')
const fs = require('fs')

// Connect to Database
const db = require('../config/db/connect')
const query = util.promisify(db.query).bind(db)

class AdminController {

  // INDEX
  index = async(req, res) => {
    try {
      const user = req.admin; // Use admin info passed by middleware

      // Count total products - using simplified count queries
      let totalProducts = 0;
      try {
        const product = await query('SELECT COUNT(*) as total FROM products');
        totalProducts = product[0].total || 0;
      } catch (err) {
        console.log('[ADMIN DASHBOARD] Error counting products:', err.message);
      }

      // Count total orders
      let totalOrders = 0;
      try {
        const order = await query('SELECT COUNT(*) as total FROM orders');
        totalOrders = order[0].total || 0;
      } catch (err) {
        console.log('[ADMIN DASHBOARD] Error counting orders:', err.message);
      }

      // Count total users
      let totalUsers = 0;
      try {
        const users = await query('SELECT COUNT(*) as total FROM users');
        totalUsers = users[0].total || 0;
      } catch (err) {
        console.log('[ADMIN DASHBOARD] Error counting users:', err.message);
      }

      // Count total categories
      let totalCategories = 0;
      try {
        const categories = await query('SELECT COUNT(*) as total FROM categories');
        totalCategories = categories[0].total || 0;
      } catch (err) {
        console.log('[ADMIN DASHBOARD] Error counting categories:', err.message);
      }
      
      // Simple stats for dashboard - avoiding complex joins that don't match your DB schema
      const stats = {
        products: totalProducts,
        orders: totalOrders,
        users: totalUsers,
        categories: totalCategories
      };

      res.render('admin/pages/index_admin', {
        title: 'Dashboard',
        user: user,
        stats: stats,
        recentOrders: [],
        orderStatistics: [],
        topProducts: []
      });
    } catch (error) {
      console.error("[ADMIN DASHBOARD] Error:", error);
      res.status(500).send("An error occurred loading the admin dashboard");
    }
  }

  // LOGIN
  login = (req, res) => {
    // Check if user already logged in & redirect to dashboard
    if (req.cookies.jwt) {
      try {
        const token = req.cookies.jwt
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.role_id === 1) {
          return res.redirect('/admin')
        }
      } catch (error) {
        console.log('Cookie has error but could not be properly parsed')
      }
    }
    
    res.render('admin/pages/login_admin', {
      title: {
        title: 'Đăng nhập quản trị viên'
      }
    })
  }

  login_post = async (req, res) => {
    try {
        const { admin_login_name, admin_password } = req.body;
        console.log('[ADMIN LOGIN] Attempt:', { admin_login_name, admin_password: '****' });

        // Validation
        if (!admin_login_name || !admin_password) {
            console.log('[ADMIN LOGIN] Missing credentials');
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        // Find admin in database
        db.query('SELECT * FROM admin WHERE admin_login_name = ?', [admin_login_name], async (err, results) => {
            if (err) {
                console.log('[ADMIN LOGIN] Database error:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Lỗi hệ thống'
                });
            }

            if (results.length === 0) {
                console.log('[ADMIN LOGIN] Admin not found:', admin_login_name);
                return res.status(401).json({
                    status: 'error',
                    message: 'Tài khoản không tồn tại'
                });
            }

            // Check password
            const isPasswordCorrect = await bcrypt.compare(admin_password, results[0].admin_password);
            
            if (!isPasswordCorrect) {
                console.log('[ADMIN LOGIN] Password incorrect for:', admin_login_name);
                return res.status(401).json({
                    status: 'error2',
                    message: 'Mật khẩu không chính xác'
                });
            }

            // Generate JWT token
            const admin_id = results[0].admin_id;
            const token = jwt.sign({ admin_id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES
            });
            
            // Set cookie
            const cookieOptions = {
                expires: new Date(
                    Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES) * 24 * 60 * 60 * 1000
                ),
                httpOnly: true,
                path: '/'
            };
            
            console.log('[ADMIN LOGIN] Setting cookie adminSave with token');
            res.cookie('adminSave', token, cookieOptions);
            
            // Return success response
            console.log('[ADMIN LOGIN] Login successful, redirecting to /admin');
            return res.status(200).json({
                status: 'success',
                message: 'Đăng nhập thành công',
                redirectUrl: '/admin'
            });
        });
    } catch (error) {
        console.log('[ADMIN LOGIN] Exception:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Đã xảy ra lỗi khi đăng nhập'
        });
    }
};

  // LOGOUT
  logout = (req, res) => {
    res.clearCookie('jwt')
    res.redirect('/admin/login')
  }

  // CATEGORIES
  categories = async (req, res) => {
    const user = req.user;

    // Fetch categories from database
    const categories = await query('SELECT * FROM categories ORDER BY category_id ASC');
    
    // Count products per category
    for (let category of categories) {
      const products = await query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [category.category_id]);
      category.productCount = products[0].count;
    }

    res.render('admin/pages/categories_admin', {
      title: {
        title: 'Quản lý danh mục sản phẩm'
      },
      user: user,
      categories
    });
  }

  category_add = (req, res) => {
    const user = req.user;
    
    res.render('admin/pages/cate_add_admin', {
      title: {
        title: 'Thêm danh mục sản phẩm'
      },
      user: user
    });
  }

  category_edit = async (req, res) => {
    const user = req.user;
    const categoryId = req.params.id;

    // Fetch category from database
    const category = await query('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
    
    if (category.length === 0) {
      return res.redirect('/admin/categories_admin');
    }

    res.render('admin/pages/cate_edit_admin', {
      title: {
        title: 'Sửa danh mục sản phẩm'
      },
      user: user,
      category: category[0]
    });
  }

  // CATEGORY API
  updateCategory = async (req, res) => {
    try {
        console.log('[ADMIN] Update category request:', req.body);
        
        const { categoryId, categoryName, categoryType } = req.body;
        
        // Validate
        if (!categoryId || !categoryName || !categoryType) {
            return res.status(400).json({
                status: 'fail',
                message: 'Thiếu thông tin cần thiết'
            });
        }

        // Update database
        let sql = 'UPDATE categories SET category_name = ?, categorry_type = ? WHERE category_id = ?';
        let values = [categoryName, categoryType, categoryId];

        // Check if there's an image upload
        if (req.files && req.files.image) {
            const image = req.files.image;
            const filename = `category_${categoryId}_${categoryName.toLowerCase().replace(/\s+/g, '_')}.${image.name.split('.').pop()}`;
            
            // Move the file
            const uploadPath = path.join(__dirname, '../public/imgs/categories/', filename);
            await image.mv(uploadPath);

            // Update SQL to include image
            sql = 'UPDATE categories SET category_name = ?, categorry_type = ?, category_img = ? WHERE category_id = ?';
            values = [categoryName, categoryType, filename, categoryId];
        }

        await query(sql, values);
        
        res.status(200).json({
            status: 'success',
            message: 'Cập nhật danh mục thành công'
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi cập nhật danh mục'
        });
    }
  }

  deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        
        // Check if category exists
        const category = await query('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
        if (category.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Không tìm thấy danh mục'
            });
        }
        
        // Get the image path to delete later
        const categoryImage = category[0].category_img;
        
        // MODIFIED: Instead of checking and preventing deletion, update products to category_id = 0
        await query('UPDATE products SET category_id = 0 WHERE category_id = ?', [categoryId]);
        console.log(`Updated products with category_id ${categoryId} to have category_id = 0`);
        
        // Delete category from database
        await query('DELETE FROM categories WHERE category_id = ?', [categoryId]);
        console.log(`Deleted category with ID ${categoryId} from database`);
        
        // Delete image file if exists
        if (categoryImage) {
            const imagePath = path.join(__dirname, '../public/imgs/categories/', categoryImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`Deleted category image: ${imagePath}`);
            }
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Xóa danh mục thành công'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi xóa danh mục'
        });
    }
  }

  addCategory = async (req, res) => {
    try {
      const { categoryName, categoryType } = req.body;
      
      // Validate
      if (!categoryName || !categoryType) {
        return res.status(400).json({
          status: 'fail',
          message: 'Vui lòng nhập đầy đủ thông tin'
        });
      }

      // Insert into database
      let sql = 'INSERT INTO categories (category_name, categorry_type, category_added_date, category_is_display) VALUES (?, ?, NOW(), 1)';
      let values = [categoryName, categoryType];
      
      const result = await query(sql, values);
      const categoryId = result.insertId;

      // Handle image upload if exists
      if (req.files && req.files.image) {
        const image = req.files.image;
        const filename = `category_${categoryId}_${categoryName.toLowerCase().replace(/\s+/g, '_')}.${image.name.split('.').pop()}`;
        
        // Move the file
        const uploadPath = path.join(__dirname, '../public/imgs/categories/', filename);
        await image.mv(uploadPath);

        // Update the newly created category with image
        await query('UPDATE categories SET category_img = ? WHERE category_id = ?', [filename, categoryId]);
      }
      
      res.status(201).json({
        status: 'success',
        message: 'Thêm danh mục thành công'
      });
    } catch (error) {
      console.error('Error adding category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Đã có lỗi xảy ra khi thêm danh mục'
      });
    }
  }

  // PRODUCTS
  products = async (req, res) => {
    const user = req.user;

    // Fetch products with category info
    const products = await query(`
      SELECT p.*, c.category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      ORDER BY p.product_id DESC
    `);

    res.render('admin/pages/products_admin', {
      title: {
        title: 'Quản lý sản phẩm'
      },
      user: user,
      products
    });
  }

  product_add = async (req, res) => {
    const user = req.user;

    // Fetch categories for product form
    const categories = await query('SELECT * FROM categories ORDER BY category_name ASC');
    
    res.render('admin/pages/product_add_admin', {
      title: {
        title: 'Thêm sản phẩm'
      },
      user: user,
      categories
    });
  }

  product_edit = async (req, res) => {
    const user = req.user;
    const productId = req.params.id;

    // Fetch product from database
    const product = await query('SELECT * FROM products WHERE product_id = ?', [productId]);
    
    if (product.length === 0) {
      return res.redirect('/admin/products_admin');
    }

    // Fetch categories for product form
    const categories = await query('SELECT * FROM categories ORDER BY category_name ASC');

    // Fetch product images
    const images = await query('SELECT * FROM product_images WHERE product_id = ?', [productId]);

    res.render('admin/pages/product_edit_admin', {
      title: {
        title: 'Sửa sản phẩm'
      },
      user: user,
      product: product[0],
      categories,
      images
    });
  }

  // PRODUCT API
  updateProduct = async (req, res) => {
    try {
      const { 
        productId, 
        productName, 
        productDesc, 
        productPrice, 
        productSalePrice, 
        productQuantity, 
        category,
        deleteImages
      } = req.body;
      
      // Validate
      if (!productId || !productName || !productPrice || !productQuantity || !category) {
        return res.status(400).json({
          status: 'fail',
          message: 'Vui lòng nhập đầy đủ thông tin cần thiết'
        });
      }

      // Update product in database
      await query(`
        UPDATE products 
        SET 
          product_name = ?, 
          product_desc = ?, 
          product_price = ?, 
          product_sale_price = ?, 
          product_quantity = ?,
          category_id = ?
        WHERE product_id = ?
      `, [
        productName, 
        productDesc, 
        productPrice, 
        productSalePrice || null, 
        productQuantity,
        category,
        productId
      ]);

      // Handle image deletion if specified
      if (deleteImages) {
        const imagesToDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
        for (const imageId of imagesToDelete) {
          // Get image filename before delete
          const image = await query('SELECT * FROM product_images WHERE image_id = ?', [imageId]);
          
          if (image.length > 0) {
            // Delete file from server
            const imagePath = path.join(__dirname, '../public/imgs/products/', image[0].image_name);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
            
            // Delete from database
            await query('DELETE FROM product_images WHERE image_id = ?', [imageId]);
          }
        }
      }

      // Handle new image uploads
      if (req.files && req.files.images) {
        const imagesToUpload = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        
        for (const image of imagesToUpload) {
          // Generate unique filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `product_${productId}_${uniqueSuffix}.${image.name.split('.').pop()}`;
          
          // Move the file
          const uploadPath = path.join(__dirname, '../public/imgs/products/', filename);
          await image.mv(uploadPath);
          
          // Save to database
          await query('INSERT INTO product_images (product_id, image_name) VALUES (?, ?)', [productId, filename]);
        }
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Cập nhật sản phẩm thành công'
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        status: 'error',
        message: 'Đã có lỗi xảy ra khi cập nhật sản phẩm'
      });
    }
  }

  deleteProduct = async (req, res) => {
    try {
      const productId = req.params.id;
      
      // Check if product exists
      const product = await query('SELECT * FROM products WHERE product_id = ?', [productId]);
      if (product.length === 0) {
        return res.status(404).json({
          status: 'fail',
          message: 'Không tìm thấy sản phẩm'
        });
      }
      
      // Check if product is in any orders
      const orderDetails = await query('SELECT COUNT(*) as count FROM order_details WHERE product_id = ?', [productId]);
      if (orderDetails[0].count > 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Không thể xóa sản phẩm này vì đã có trong đơn hàng'
        });
      }

      // Get all images to delete files
      const images = await query('SELECT * FROM product_images WHERE product_id = ?', [productId]);
      
      // Delete all images from server
      for (const image of images) {
        const imagePath = path.join(__dirname, '../public/imgs/products/', image.image_name);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Delete from database (images and product)
      await query('DELETE FROM product_images WHERE product_id = ?', [productId]);
      await query('DELETE FROM products WHERE product_id = ?', [productId]);
      
      res.status(200).json({
        status: 'success',
        message: 'Xóa sản phẩm thành công'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        status: 'error',
        message: 'Đã có lỗi xảy ra khi xóa sản phẩm'
      });
    }
  }

  addProduct = async (req, res) => {
    try {
      const { 
        productName, 
        productDesc, 
        productPrice, 
        productSalePrice, 
        productQuantity, 
        category
      } = req.body;
      
      // Validate
      if (!productName || !productPrice || !productQuantity || !category) {
        return res.status(400).json({
          status: 'fail',
          message: 'Vui lòng nhập đầy đủ thông tin cần thiết'
        });
      }

      // Insert product to database
      const result = await query(`
        INSERT INTO products 
        (product_name, product_desc, product_price, product_sale_price, product_quantity, category_id, product_added_date) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [
        productName, 
        productDesc, 
        productPrice, 
        productSalePrice || null, 
        productQuantity,
        category
      ]);
      
      const productId = result.insertId;

      // Handle image uploads
      if (req.files && req.files.images) {
        const imagesToUpload = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        
        for (const image of imagesToUpload) {
          // Generate unique filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = `product_${productId}_${uniqueSuffix}.${image.name.split('.').pop()}`;
          
          // Move the file
          const uploadPath = path.join(__dirname, '../public/imgs/products/', filename);
          await image.mv(uploadPath);
          
          // Save to database
          await query('INSERT INTO product_images (product_id, image_name) VALUES (?, ?)', [productId, filename]);
        }
      }
      
      res.status(201).json({
        status: 'success',
        message: 'Thêm sản phẩm thành công'
      });
    } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({
        status: 'error',
        message: 'Đã có lỗi xảy ra khi thêm sản phẩm'
      });
    }
  }

  // ORDERS
  orders = async (req, res) => {
    const user = req.user;

    // Fetch orders with user info
    const orders = await query(`
      SELECT o.*, u.user_fullname
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      ORDER BY o.order_date DESC
    `);

    res.render('admin/pages/orders_admin', {
      title: {
        title: 'Quản lý đơn hàng'
      },
      user: user,
      orders
    });
  }

  order_details = async (req, res) => {
    const user = req.user;
    const orderId = req.params.id;

    // Fetch order with user info
    const orders = await query(`
      SELECT o.*, u.user_fullname, u.user_email, u.user_phone
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ?
    `, [orderId]);
    
    if (orders.length === 0) {
      return res.redirect('/admin/orders_admin');
    }

    // Fetch order details with product info
    const orderDetails = await query(`
      SELECT od.*, p.product_name, p.product_price, pi.image_name
      FROM order_details od
      JOIN products p ON od.product_id = p.product_id
      LEFT JOIN (
        SELECT product_id, MIN(image_id) as min_image_id, image_name
        FROM product_images
        GROUP BY product_id
      ) pi ON p.product_id = pi.product_id
      WHERE od.order_id = ?
    `, [orderId]);

    res.render('admin/pages/order_details_admin', {
      title: {
        title: 'Chi tiết đơn hàng'
      },
      user: user,
      order: orders[0],
      orderDetails
    });
  }

  // ORDER API
  updateOrderStatus = async (req, res) => {
    try {
      const { orderId, status } = req.body;
      
      // Validate
      if (!orderId || !status) {
        return res.status(400).json({
          status: 'fail',
          message: 'Thiếu thông tin cần thiết'
        });
      }

      // Update order status
      await query('UPDATE orders SET order_status = ? WHERE order_id = ?', [status, orderId]);
      
      res.status(200).json({
        status: 'success',
        message: 'Cập nhật trạng thái đơn hàng thành công'
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Đã có lỗi xảy ra khi cập nhật trạng thái đơn hàng'
      });
    }
  }

  // USERS
  users = async (req, res) => {
    try {
      const user = req.admin;

      // Get all users without filtering by role_id (which doesn't exist in your schema)
      const users = await query(`
        SELECT *
        FROM users
        ORDER BY user_id DESC
      `);

      res.render('admin/pages/users_admin', {
        title: {
          title: 'Quản lý người dùng'
        },
        user: user,
        users
      });
    } catch (error) {
      console.error('[ADMIN] Error loading users:', error.message);
      res.status(500).send("Error loading users page");
    }
  };
 
  // Add this method to your controller
  category_update_tool = (req, res) => {
    return res.render('admin/pages/category_update_tool', {
        title: {
            title: 'Công cụ cập nhật danh mục'
        }
    });
  }

  // API to get all categories
  getCategories = async (req, res) => {
    try {
      const categories = await query('SELECT * FROM categories ORDER BY category_name ASC');
      res.status(200).json({
        status: 'success',
        categories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        status: 'error',
        message: 'Đã xảy ra lỗi khi lấy danh sách danh mục'
      });
    }
  }

  // API to get a single category
  getCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
      const category = await query('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
      
      if (category.length === 0) {
        return res.status(404).json({
          status: 'fail',
          message: 'Không tìm thấy danh mục'
        });
      }
      
      res.status(200).json({
        status: 'success',
        category: category[0]
      });
    } catch (error) {
      console.error('Error getting category:', error);
      res.status(500).json({
        status: 'error',
        message: 'Đã xảy ra lỗi khi lấy thông tin danh mục'
      });
    }
  }
}

module.exports = new AdminController()
