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
      
      // Simple stats for dashboard
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
    if (req.cookies.adminSave) {
      try {
        const token = req.cookies.adminSave;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.admin_id) {
          return res.redirect('/admin');
        }
      } catch (error) {
        console.log('Cookie has error but could not be properly parsed');
      }
    }
    
    res.render('admin/pages/login_admin', {
      title: {
        title: 'Đăng nhập quản trị viên'
      }
    });
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
  }

  // LOGOUT
  logout = (req, res) => {
    res.clearCookie('adminSave');
    res.redirect('/admin/login');
  }

  // CATEGORIES
  categories = async (req, res) => {
    try {
      const user = req.admin;

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
    } catch (error) {
      console.error("[ADMIN] Error loading categories:", error);
      res.status(500).render('admin/pages/error', {
        title: {
          title: 'Lỗi hệ thống'
        },
        user: req.admin,
        message: 'Đã xảy ra lỗi khi tải danh mục sản phẩm',
        errorDetails: process.env.NODE_ENV !== 'production' ? error.stack : null
      });
    }
  }

  category_add = (req, res) => {
    const user = req.admin;
    
    res.render('admin/pages/cate_add_admin', {
      title: {
        title: 'Thêm danh mục sản phẩm'
      },
      user: user
    });
  }

  category_edit = async (req, res) => {
    try {
      const user = req.admin;
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
    } catch (error) {
      console.error("[ADMIN] Error loading category edit:", error);
      res.status(500).render('admin/pages/error', {
        title: {
          title: 'Lỗi hệ thống'
        },
        user: req.admin,
        message: 'Đã xảy ra lỗi khi tải thông tin danh mục',
        errorDetails: process.env.NODE_ENV !== 'production' ? error.stack : null
      });
    }
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
        
        // Instead of checking and preventing deletion, update products to category_id = 0
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
  getProducts = async (req, res) => {
    try {
      const searchKey = req.query.searchKey || '';
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      
      // Count total products that match the search
      let countQuery = `
          SELECT COUNT(*) as total 
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.category_id
          WHERE p.product_name LIKE ? OR c.category_name LIKE ?
      `;
      
      const countValues = [`%${searchKey}%`, `%${searchKey}%`];
      const totalResult = await query(countQuery, countValues);
      const totalRow = totalResult[0].total;
      
      // Get products with pagination and search
      let productsQuery = `
          SELECT p.*, 
              c.category_name,
              COUNT(pv.product_variant_id) as product_count,
              COALESCE(SUM(od.order_detail_price_after * od.order_detail_quantity), 0) as revenue,
              (SELECT image_name FROM product_imgs pi WHERE pi.product_id = p.product_id ORDER BY pi.image_id ASC LIMIT 1) as product_avt_img
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.category_id
          LEFT JOIN product_variants pv ON p.product_id = pv.product_id
          LEFT JOIN order_details od ON pv.product_variant_id = od.product_variant_id
          WHERE p.product_name LIKE ? OR c.category_name LIKE ?
          GROUP BY p.product_id
          ORDER BY p.product_id DESC
          LIMIT ?, ?
      `;
      
      const productValues = [`%${searchKey}%`, `%${searchKey}%`, offset, limit];
      const products = await query(productsQuery, productValues);
      
      // Calculate total pages
      const totalPage = Math.ceil(totalRow / limit);
      
      // Return formatted data
      const formatFunction = {
          toCurrency: function(money) {
              return money.toLocaleString('vi-VN') + 'đ';
          }
      };
      
      res.render('admin/pages/product_admin', {
          title: {
              title: 'Quản lý sản phẩm'
          },
          admin: req.admin,
          user: req.admin, // Add this to make the sidebar template work
          data: {
              products,
              searchKey,
              totalRow,
              totalPage,
              page,
              limit
          },
          formatFunction
      });
    } catch (error) {
      console.error("[ADMIN] Error loading products:", error);
      res.status(500).render('admin/pages/error', {
        title: {
          title: 'Lỗi hệ thống'
        },
        user: req.admin,
        message: 'Đã xảy ra lỗi khi tải danh sách sản phẩm',
        errorDetails: process.env.NODE_ENV !== 'production' ? error.stack : null
      });
    }
  }

  // Add product page
  addProductPage = async (req, res) => {
    try {
      console.log("[ADMIN] Loading add product page...");
      
      // Get categories for dropdown
      console.log("[ADMIN] Fetching categories...");
      const categories = await query('SELECT * FROM categories ORDER BY category_name');
      console.log(`[ADMIN] Found ${categories.length} categories`);
      
      console.log("[ADMIN] Rendering product_add_admin template");
      res.render('admin/pages/product_add_admin', {
          title: {
              title: 'Thêm sản phẩm mới'
          },
          admin: req.admin,
          user: req.admin, // Add this to make the sidebar template work
          categories
      });
      console.log("[ADMIN] Add product page rendered successfully");
    } catch (error) {
      console.error("[ADMIN] Error loading add product page:", error);
      console.error("[ADMIN] Error stack:", error.stack);
      res.status(500).render('admin/pages/error', {
        title: {
          title: 'Lỗi hệ thống'
        },
        user: req.admin,
        message: 'Đã xảy ra lỗi khi tải trang thêm sản phẩm',
        errorDetails: process.env.NODE_ENV !== 'production' ? error.stack : null
      });
    }
  }

  // Edit product page
  editProductPage = async (req, res) => {
    try {
      const productId = req.params.id;
      console.log(`[ADMIN] Loading edit product page for product ID: ${productId}`);
      
      // Get product info
      console.log("[ADMIN] Fetching product data...");
      const productQuery = `
          SELECT p.*, c.category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.category_id
          WHERE p.product_id = ?
      `;
      
      const productResult = await query(productQuery, [productId]);
      console.log(`[ADMIN] Product query completed, found ${productResult.length} results`);
      
      if (productResult.length === 0) {
          console.log(`[ADMIN] Product not found with ID: ${productId}`);
          return res.status(404).render('admin/pages/error', {
              title: {
                title: 'Lỗi - Không tìm thấy sản phẩm'
              },
              admin: req.admin,
              user: req.admin,
              message: 'Không tìm thấy sản phẩm với ID đã cung cấp.'
          });
      }
      
      const product = productResult[0];
      console.log(`[ADMIN] Found product: ${product.product_name}`);
      
      // Get product variants
      console.log("[ADMIN] Fetching product variants...");
      const variantsQuery = `
          SELECT * FROM product_variants
          WHERE product_id = ?
          ORDER BY product_variant_id
      `;
      
      const variants = await query(variantsQuery, [productId]);
      console.log(`[ADMIN] Found ${variants.length} variants for product`);
      
      // Get product images
      console.log("[ADMIN] Fetching product images...");
      const imagesQuery = `
          SELECT * FROM product_imgs
          WHERE product_id = ?
          ORDER BY image_id
      `;
      
      const images = await query(imagesQuery, [productId]);
      console.log(`[ADMIN] Found ${images.length} images for product`);
      
      // Get product details (specifications)
      console.log("[ADMIN] Fetching product specifications...");
      const specsQuery = `
          SELECT * FROM product_details
          WHERE product_id = ?
          ORDER BY product_detail_id
      `;
      
      const specs = await query(specsQuery, [productId]);
      console.log(`[ADMIN] Found ${specs.length} specifications for product`);
      
      // Get all categories for dropdown
      console.log("[ADMIN] Fetching categories for dropdown...");
      const categories = await query('SELECT * FROM categories ORDER BY category_name');
      console.log(`[ADMIN] Found ${categories.length} categories`);
      
      console.log("[ADMIN] All data fetched, rendering product_edit_admin template");
      console.log("[ADMIN] Rendering with data:", {
          productId,
          productName: product.product_name,
          variantCount: variants.length,
          imageCount: images.length,
          specCount: specs.length,
          categoryCount: categories.length
      });
      
      res.render('admin/pages/product_edit_admin', {
          title: {
              title: 'Sửa thông tin sản phẩm'
          },
          admin: req.admin,
          user: req.admin,
          product,
          variants,
          images,
          specs,
          categories
      });
      console.log("[ADMIN] Edit product page rendered successfully");
    } catch (error) {
      console.error("[ADMIN] Error loading edit product page:", error);
      console.error("[ADMIN] Error stack:", error.stack);
      res.status(500).render('admin/pages/error', {
        title: {
          title: 'Lỗi hệ thống'
        },
        user: req.admin,
        message: 'Đã xảy ra lỗi khi tải trang sửa sản phẩm',
        errorDetails: process.env.NODE_ENV !== 'production' ? error.stack : null
      });
    }
  }

  // Add product API
  addProduct = async (req, res) => {
    console.log("[ADMIN] Add product API called");
    console.log("[ADMIN] Request body:", req.body);
    console.log("[ADMIN] Files:", req.files ? Object.keys(req.files) : 'No files');
    
    try {
      // Start transaction
      await query('START TRANSACTION');
      
      // Insert basic product info
      const { product_name, category_id, product_description } = req.body;
      const product_is_bestseller = req.body.product_is_bestseller ? 1 : 0;
      const product_is_display = req.body.product_is_display ? 1 : 0;
      
      // Validate product name and category
      if (!product_name || !category_id) {
        await query('ROLLBACK');
        return res.status(400).json({
          status: 'error',
          message: 'Thiếu thông tin sản phẩm hoặc danh mục'
        });
      }
      
      // Insert into products table
      const productResult = await query(
        'INSERT INTO products (product_name, category_id, product_description, product_is_bestseller, product_is_display, product_added_date) VALUES (?, ?, ?, ?, ?, NOW())',
        [product_name, category_id, product_description, product_is_bestseller, product_is_display]
      );
      
      const productId = productResult.insertId;
      
      // Handle variants
      const variants = [];
      
      // Parse variant data from form
      for (let i = 0; i < 100; i++) { // Arbitrary limit
        const variantName = req.body[`variants[${i}][name]`];
        const variantPrice = req.body[`variants[${i}][price]`];
        const variantStock = req.body[`variants[${i}][stock]`];
        const variantIsBestseller = req.body[`variants[${i}][is_bestseller]`] ? 1 : 0;
        
        if (!variantName || !variantPrice) continue;
        
        variants.push({
          name: variantName,
          price: variantPrice,
          stock: variantStock || 100,
          is_bestseller: variantIsBestseller
        });
      }
      
      // Check if we have at least one variant
      if (variants.length === 0) {
        await query('ROLLBACK');
        return res.status(400).json({
          status: 'error',
          message: 'Sản phẩm cần có ít nhất một biến thể'
        });
      }
      
      // Insert variants
      for (const variant of variants) {
        await query(
          'INSERT INTO product_variants (product_id, product_variant_name, product_variant_price, product_variant_available, product_variant_is_bestseller, product_variant_added_date, product_variant_is_display) VALUES (?, ?, ?, ?, ?, NOW(), 1)',
          [productId, variant.name, variant.price, variant.stock, variant.is_bestseller]
        );
      }
      
      // Handle specifications
      const specs = [];
      
      // Parse spec data from form
      for (let i = 0; i < 100; i++) { // Arbitrary limit
        const specName = req.body[`specs[${i}][name]`];
        const specValue = req.body[`specs[${i}][value]`];
        
        if (!specName || !specValue) continue;
        
        specs.push({
          name: specName,
          value: specValue
        });
      }
      
      // Insert specs
      for (const spec of specs) {
        await query(
          'INSERT INTO product_details (product_id, product_detail_name, product_detail_value) VALUES (?, ?, ?)',
          [productId, spec.name, spec.value]
        );
      }
      
      // Handle image uploads
      if (req.files && req.files.product_images) {
        const images = Array.isArray(req.files.product_images) ? req.files.product_images : [req.files.product_images];
        
        // Create directory for product images if it doesn't exist
        const productDir = path.join(__dirname, '../public/imgs/product_image/P' + productId);
        if (!fs.existsSync(productDir)) {
          fs.mkdirSync(productDir, { recursive: true });
        }
        
        // Save each image
        for (const image of images) {
          const extension = image.name.split('.').pop();
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const fileName = `P${productId}_${uniqueSuffix}.${extension}`;
          
          // Move file to product's directory
          const uploadPath = path.join(productDir, fileName);
          await image.mv(uploadPath);
          
          // Insert into database
          await query('INSERT INTO product_imgs (product_id, image_name) VALUES (?, ?)', [productId, fileName]);
        }
      }
      
      // Commit transaction
      await query('COMMIT');
      
      // Return success response
      console.log("[ADMIN] Product added successfully with ID:", productId);
      res.status(201).json({
        status: 'success',
        message: 'Thêm sản phẩm thành công',
        productId: productId
      });
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      console.error('[ADMIN] Error adding product:', error);
      console.error('[ADMIN] Error stack:', error.stack);
      res.status(500).json({
        status: 'error',
        message: 'Đã có lỗi xảy ra khi thêm sản phẩm'
      });
    }
  }
  
  // API to update a product
  updateProduct = async (req, res) => {
    console.log("[ADMIN] Update product API called");
    console.log("[ADMIN] Product ID:", req.body.product_id);
    
    try {
        // Start transaction
        await query('START TRANSACTION');
        
        const { product_id, product_name, category_id, product_description } = req.body;
        const product_is_bestseller = req.body.product_is_bestseller ? 1 : 0;
        const product_is_display = req.body.product_is_display ? 1 : 0;
        
        // Validate
        if (!product_id || !product_name || !category_id) {
            await query('ROLLBACK');
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu thông tin sản phẩm'
            });
        }
        
        // Update product info
        await query(
            'UPDATE products SET product_name = ?, category_id = ?, product_description = ?, product_is_bestseller = ?, product_is_display = ? WHERE product_id = ?',
            [product_name, category_id, product_description, product_is_bestseller, product_is_display, product_id]
        );
        
        // Process variants
        // First get all existing variants
        const existingVariants = await query('SELECT product_variant_id FROM product_variants WHERE product_id = ?', [product_id]);
        const existingVariantIds = existingVariants.map(v => v.product_variant_id);
        
        // Track which variants to keep
        const variantIdsToKeep = [];
        
        // Process variants from the form
        for (let i = 0; i < 100; i++) { // Arbitrary limit
            const variantName = req.body[`variants[${i}][name]`];
            const variantPrice = req.body[`variants[${i}][price]`];
            const variantStock = req.body[`variants[${i}][stock]`];
            const variantId = req.body[`variants[${i}][id]`];
            const variantIsBestseller = req.body[`variants[${i}][is_bestseller]`] ? 1 : 0;
            
            if (!variantName || !variantPrice) continue;
            
            if (variantId) {
                // Update existing variant
                await query(
                    'UPDATE product_variants SET product_variant_name = ?, product_variant_price = ?, product_variant_available = ?, product_variant_is_bestseller = ? WHERE product_variant_id = ? AND product_id = ?',
                    [variantName, variantPrice, variantStock, variantIsBestseller, variantId, product_id]
                );
                variantIdsToKeep.push(Number(variantId));
            } else {
                // Insert new variant
                const result = await query(
                    'INSERT INTO product_variants (product_id, product_variant_name, product_variant_price, product_variant_available, product_variant_is_bestseller, product_variant_added_date, product_variant_is_display) VALUES (?, ?, ?, ?, ?, NOW(), 1)',
                    [product_id, variantName, variantPrice, variantStock, variantIsBestseller]
                );
                variantIdsToKeep.push(result.insertId);
            }
        }
        
        // Delete variants that weren't in the form
        const variantIdsToDelete = existingVariantIds.filter(id => !variantIdsToKeep.includes(id));
        
        if (variantIdsToDelete.length > 0) {
            await query(
                'DELETE FROM product_variants WHERE product_variant_id IN (?) AND product_id = ?',
                [variantIdsToDelete, product_id]
            );
        }
        
        // Process specifications
        // First get all existing specs
        const existingSpecs = await query('SELECT product_detail_id FROM product_details WHERE product_id = ?', [product_id]);
        const existingSpecIds = existingSpecs.map(s => s.product_detail_id);
        
        // Track which specs to keep
        const specIdsToKeep = [];
        
        // Process specs from the form
        for (let i = 0; i < 100; i++) { // Arbitrary limit
            const specName = req.body[`specs[${i}][name]`];
            const specValue = req.body[`specs[${i}][value]`];
            const specId = req.body[`specs[${i}][id]`];
            
            if (!specName || !specValue) continue;
            
            if (specId) {
                // Update existing spec
                await query(
                    'UPDATE product_details SET product_detail_name = ?, product_detail_value = ? WHERE product_detail_id = ? AND product_id = ?',
                    [specName, specValue, specId, product_id]
                );
                specIdsToKeep.push(Number(specId));
            } else {
                // Insert new spec
                const result = await query(
                    'INSERT INTO product_details (product_id, product_detail_name, product_detail_value) VALUES (?, ?, ?)',
                    [product_id, specName, specValue]
                );
                specIdsToKeep.push(result.insertId);
            }
        }
        
        // Delete specs that weren't in the form
        const specIdsToDelete = existingSpecIds.filter(id => !specIdsToKeep.includes(id));
        
        if (specIdsToDelete.length > 0) {
            await query(
                'DELETE FROM product_details WHERE product_detail_id IN (?) AND product_id = ?',
                [specIdsToDelete, product_id]
            );
        }
        
        // Handle image deletions
        const deleteImages = req.body.delete_images ? 
            (Array.isArray(req.body.delete_images) ? req.body.delete_images : [req.body.delete_images]) : [];
        
        if (deleteImages.length > 0) {
            // Get filenames to delete files
            for (const imageId of deleteImages) {
                const image = await query('SELECT image_name FROM product_imgs WHERE image_id = ? AND product_id = ?', [imageId, product_id]);
                
                if (image.length > 0) {
                    // Delete file from server
                    const imagePath = path.join(__dirname, '../public/imgs/product_image/P' + product_id, image[0].image_name);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                    
                    // Delete from database
                    await query('DELETE FROM product_imgs WHERE image_id = ?', [imageId]);
                }
            }
        }
        
        // Handle new image uploads
        if (req.files) {
            // Get all files that start with "new_image_"
            const newImageKeys = Object.keys(req.files).filter(key => key.startsWith('new_image_'));
            
            if (newImageKeys.length > 0) {
                // Ensure product image directory exists
                const productImageDir = path.join(__dirname, '../public/imgs/product_image/P' + product_id);
                if (!fs.existsSync(productImageDir)) {
                    fs.mkdirSync(productImageDir, { recursive: true });
                }
                
                // Process each new image
                for (const key of newImageKeys) {
                    const image = req.files[key];
                    const extension = image.name.split('.').pop();
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const fileName = `P${product_id}_${uniqueSuffix}.${extension}`;
                    
                    // Move file to product's directory
                    const uploadPath = path.join(productImageDir, fileName);
                    await image.mv(uploadPath);
                    
                    // Insert into database
                    await query('INSERT INTO product_imgs (product_id, image_name) VALUES (?, ?)', [product_id, fileName]);
                }
            }
        }
        
        // Commit transaction
        await query('COMMIT');
        console.log("[ADMIN] Product updated successfully");
        res.status(200).json({
            status: 'success',
            message: 'Cập nhật sản phẩm thành công'
        });
    } catch (error) {
        // Rollback transaction on error
        await query('ROLLBACK');
        console.error('Error updating product:', error);
        console.error('[ADMIN] Error stack:', error.stack);
        res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi cập nhật sản phẩm'
        });
    }
  }

  // Delete product
  deleteProduct = async (req, res) => {
    try {
      const productId = req.params.id;
      
      if (!productId) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing product ID'
        });
      }
      
      // Start transaction
      await query('START TRANSACTION');
      
      // Check if product exists
      const product = await query('SELECT * FROM products WHERE product_id = ?', [productId]);
      
      if (product.length === 0) {
        await query('ROLLBACK');
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }
      
      // Check if product is in any orders
      const variants = await query('SELECT product_variant_id FROM product_variants WHERE product_id = ?', [productId]);
      const variantIds = variants.map(v => v.product_variant_id);
      
      if (variantIds.length > 0) {
        const orders = await query('SELECT COUNT(*) as count FROM order_details WHERE product_variant_id IN (?)', [variantIds]);
        if (orders[0].count > 0) {
          await query('ROLLBACK');
          return res.status(400).json({
            status: 'error',
            message: 'Cannot delete product that is in orders'
          });
        }
      }
      
      // Get product images to delete files
      const images = await query('SELECT * FROM product_imgs WHERE product_id = ?', [productId]);
      
      // Delete image files
      for (const image of images) {
        const imagePath = path.join(__dirname, '../public/imgs/product_image/P' + productId, image.image_name);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Delete product directory if exists
      const productDir = path.join(__dirname, '../public/imgs/product_image/P' + productId);
      if (fs.existsSync(productDir)) {
        fs.rmdirSync(productDir, { recursive: true });
      }
      
      // Delete from database
      await query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
      await query('DELETE FROM product_details WHERE product_id = ?', [productId]);
      await query('DELETE FROM product_imgs WHERE product_id = ?', [productId]);
      await query('DELETE FROM products WHERE product_id = ?', [productId]);
      
      // Commit transaction
      await query('COMMIT');
      
      res.status(200).json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error deleting product:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while deleting the product'
      });
    }
  }

  // Add a new API method for bulk deletion
  bulkDeleteProducts = async (req, res) => {
    try {
        const { productIds } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Không có sản phẩm được chọn để xóa'
            });
        }
        
        // Start transaction
        await query('START TRANSACTION');
        
        // For each product, check if it's in orders
        const checkOrdersPromises = productIds.map(async (id) => {
            const variants = await query('SELECT product_variant_id FROM product_variants WHERE product_id = ?', [id]);
            const variantIds = variants.map(v => v.product_variant_id);
            
            if (variantIds.length > 0) {
                const orders = await query('SELECT COUNT(*) as count FROM order_details WHERE product_variant_id IN (?)', [variantIds]);
                return {
                    productId: id,
                    inOrders: orders[0].count > 0
                };
            }
            
            return { productId: id, inOrders: false };
        });
        
        const checkResults = await Promise.all(checkOrdersPromises);
        const productsToDelete = checkResults.filter(r => !r.inOrders).map(r => r.productId);
        const productsInOrders = checkResults.filter(r => r.inOrders).map(r => r.productId);
        
        // Delete products that aren't in orders
        if (productsToDelete.length > 0) {
            // Delete product files first
            for (const productId of productsToDelete) {
                // Get images
                const images = await query('SELECT * FROM product_imgs WHERE product_id = ?', [productId]);
                
                // Delete image files
                for (const image of images) {
                    const imagePath = path.join(__dirname, '../public/imgs/product_image/P' + productId, image.image_name);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
                
                // Delete product directory if exists
                const productDir = path.join(__dirname, '../public/imgs/product_image/P' + productId);
                if (fs.existsSync(productDir)) {
                    fs.rmdirSync(productDir, { recursive: true });
                }
                
                // Delete from database
                // Delete product variants
                await query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
                
                // Delete product details
                await query('DELETE FROM product_details WHERE product_id = ?', [productId]);
                
                // Delete product images
                await query('DELETE FROM product_imgs WHERE product_id = ?', [productId]);
                
                // Delete the product
                await query('DELETE FROM products WHERE product_id = ?', [productId]);
            }
        }
        
        // Commit transaction
        await query('COMMIT');
        
        // Return response based on results
        if (productsInOrders.length > 0) {
            return res.status(200).json({
                status: 'partial',
                message: `Đã xóa ${productsToDelete.length} sản phẩm. ${productsInOrders.length} sản phẩm không thể xóa do đã có trong đơn hàng.`,
                deletedCount: productsToDelete.length,
                failedCount: productsInOrders.length
            });
        } else {
            return res.status(200).json({
                status: 'success',
                message: `Đã xóa thành công ${productsToDelete.length} sản phẩm.`,
                deletedCount: productsToDelete.length
            });
        }
    } catch (error) {
        // Rollback transaction on error
        await query('ROLLBACK');
        console.error('Error bulk deleting products:', error);
        res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi xóa sản phẩm'
        });
    }
  }

  // Add a new API method for bulk visibility update
  updateProductsVisibility = async (req, res) => {
    try {
        const { productIds, visibility } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Không có sản phẩm được chọn'
            });
        }
        
        if (visibility !== 0 && visibility !== 1) {
            return res.status(400).json({
                status: 'error',
                message: 'Trạng thái hiển thị không hợp lệ'
            });
        }
        
        // Update products visibility
        await query('UPDATE products SET product_is_display = ? WHERE product_id IN (?)', [visibility, productIds]);
        
        res.status(200).json({
            status: 'success',
            message: `Đã cập nhật trạng thái hiển thị cho ${productIds.length} sản phẩm.`
        });
    } catch (error) {
        console.error('Error updating products visibility:', error);
        res.status(500).json({
            status: 'error',
            message: 'Đã có lỗi xảy ra khi cập nhật trạng thái hiển thị sản phẩm'
        });
    }
  }

  // ORDERS
  orders = async (req, res) => {
    try {
      const user = req.admin;

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
    } catch (error) {
      console.error("Error loading orders:", error);
      res.status(500).render('admin/pages/error', {
        title: {
          title: 'Lỗi hệ thống'
        },
        user: req.admin,
        message: 'Đã xảy ra lỗi khi tải danh sách đơn hàng',
        errorDetails: process.env.NODE_ENV !== 'production' ? error.stack : null
      });
    }
  }

  order_details = async (req, res) => {
    try {
      const user = req.admin;
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
          FROM product_imgs
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
    } catch (error) {
      console.error("Error loading order details:", error);
      res.status(500).render('admin/pages/error', {
        title: {
          title: 'Lỗi hệ thống'
        },
        user: req.admin,
        message: 'Đã xảy ra lỗi khi tải chi tiết đơn hàng',
        errorDetails: process.env.NODE_ENV !== 'production' ? error.stack : null
      });
    }
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
        message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng'
      });
    }
  }

  // USERS
  users = async (req, res) => {
    try {
      const user = req.admin;

      // Get all users
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
      res.status(500).render('admin/pages/error', {
        title: {
          title: 'Lỗi hệ thống'
        },
        user: req.admin,
        message: 'Đã xảy ra lỗi khi tải danh sách người dùng',
        errorDetails: process.env.NODE_ENV !== 'production' ? error.stack : null
      });
    }
  }
 
  // Add this method to your controller
  category_update_tool = (req, res) => {
    return res.render('admin/pages/category_update_tool', {
      title: {
        title: 'Công cụ cập nhật danh mục'
      },
      user: req.admin
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