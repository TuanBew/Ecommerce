const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const util = require('util');
const path = require('path');
const fs = require('fs');

// Connect to Database
const db = require('../config/db/connect');
const query = util.promisify(db.query).bind(db);

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
      console.log("[ADMIN] Accessing category_edit with params:", req.params);
      const user = req.admin;
      const categoryId = req.params.id;

      if (!categoryId) {
        console.error("[ADMIN] Missing category ID in request");
        return res.redirect('/admin/categories_admin');
      }

      // Fetch category from database
      const category = await query('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
      
      if (category.length === 0) {
        console.error("[ADMIN] Category not found with ID:", categoryId);
        return res.redirect('/admin/categories_admin');
      }

      console.log("[ADMIN] Successfully retrieved category:", category[0].category_name);
      
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

  // Edit product page - Enhanced to include more data
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
            SELECT pv.*, d.discount_name, d.discount_amount
            FROM product_variants pv
            LEFT JOIN discounts d ON pv.discount_id = d.discount_id
            WHERE pv.product_id = ?
            ORDER BY pv.product_variant_id
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
        
        // Get all suppliers for dropdown
        console.log("[ADMIN] Fetching suppliers for dropdown...");
        const suppliers = await query('SELECT * FROM suppliers ORDER BY supplier_name');
        console.log(`[ADMIN] Found ${suppliers.length} suppliers`);
        
        // Get all discounts for dropdown
        console.log("[ADMIN] Fetching discounts for dropdown...");
        const discounts = await query('SELECT * FROM discounts WHERE discount_is_display = 1 ORDER BY discount_name');
        console.log(`[ADMIN] Found ${discounts.length} active discounts`);
        
        // Ensure product_avt_img is set to the first image if it's null
        if (!product.product_avt_img && images.length > 0) {
            product.product_avt_img = images[0].image_name;
            await query('UPDATE products SET product_avt_img = ? WHERE product_id = ?', [product.product_avt_img, productId]);
            console.log(`[ADMIN] Updated product avatar image to: ${product.product_avt_img}`);
        }
        
        // Render template with all data
        console.log("[ADMIN] All data fetched, rendering product_edit_admin template");
        console.log("[ADMIN] Rendering with data:", {
            productId,
            productName: product.product_name,
            variantCount: variants.length,
            imageCount: images.length,
            specCount: specs.length,
            categoryCount: categories.length,
            supplierCount: suppliers.length,
            discountCount: discounts.length
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
            categories,
            suppliers,
            discounts
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
      console.error('[ADMIN] Error adding product:', error);
      res.status(500).json({
        status: 'error',
        message: 'Đã có lỗi xảy ra khi thêm sản phẩm'
      });
    }
  }

  // Update Product implementation
  updateProduct = async (req, res) => {
    console.log("\n[PRODUCT UPDATE] ==============================================");
    console.log("[PRODUCT UPDATE] Start processing update request");
    console.log("[PRODUCT UPDATE] Request URL:", req.originalUrl);
    console.log("[PRODUCT UPDATE] Product ID from params:", req.params.id);
    console.log("[PRODUCT UPDATE] Product ID from body:", req.body.product_id);
    
    // Parse changed fields for efficient updates
    let changedFields = [];
    try {
        if (req.body.changed_fields) {
            changedFields = JSON.parse(req.body.changed_fields);
            console.log("[PRODUCT UPDATE] Changed fields:", changedFields);
        }
    } catch (e) {
        console.error("[PRODUCT UPDATE] Error parsing changed fields:", e);
    }
    
    // Check if there are no changes
    const hasChanges = changedFields.length > 0 || 
                      (req.files && Object.keys(req.files).length > 0) || 
                      req.body.delete_images;
                      
    if (!hasChanges) {
        console.log("[PRODUCT UPDATE] No changes detected, returning early");
        return res.status(200).json({
            status: 'success',
            message: 'No changes detected'
        });
    }
    
    try {
        // Get product ID from params or body
        const productId = req.params.id || req.body.product_id;
        
        if (!productId) {
            console.error("[PRODUCT UPDATE] Error: Missing product ID");
            return res.status(400).json({
                status: 'error',
                message: 'Missing product ID'
            });
        }
        
        // Extract product data from form
        const { 
            product_name, 
            category_id, 
            supplier_id,
            product_description, 
            product_period 
        } = req.body;
        
        const product_is_display = req.body.product_is_display ? 1 : 0;
        const product_is_bestseller = req.body.product_is_bestseller ? 1 : 0;
        
        console.log("[PRODUCT UPDATE] Basic product data:", {
            productId,
            product_name,
            category_id,
            supplier_id,
            product_is_bestseller,
            product_is_display,
            product_period
        });
        
        // Validate required fields
        if (!product_name || !category_id) {
            console.error("[PRODUCT UPDATE] Error: Missing required fields");
            return res.status(400).json({
                status: 'error',
                message: 'Product name and category are required'
            });
        }
        
        // Begin database transaction
        await query('START TRANSACTION');
        
        // Update the product's basic information - only if fields have changed
        const productFieldsToUpdate = [];
        const productParamsToUpdate = [];
        
        if (changedFields.includes('product_name')) {
            productFieldsToUpdate.push('product_name = ?');
            productParamsToUpdate.push(product_name);
        }
        
        if (changedFields.includes('category_id')) {
            productFieldsToUpdate.push('category_id = ?');
            productParamsToUpdate.push(category_id);
        }
        
        if (changedFields.includes('supplier_id')) {
            productFieldsToUpdate.push('supplier_id = ?');
            productParamsToUpdate.push(supplier_id || null);
        }
        
        if (changedFields.includes('product_description')) {
            productFieldsToUpdate.push('product_description = ?');
            productParamsToUpdate.push(product_description);
        }
        
        if (changedFields.includes('product_is_bestseller')) {
            productFieldsToUpdate.push('product_is_bestseller = ?');
            productParamsToUpdate.push(product_is_bestseller);
        }
        
        if (changedFields.includes('product_is_display')) {
            productFieldsToUpdate.push('product_is_display = ?');
            productParamsToUpdate.push(product_is_display);
        }
        
        if (changedFields.includes('product_period')) {
            productFieldsToUpdate.push('product_period = ?');
            productParamsToUpdate.push(product_period || 12);
        }
        
        // Only update product if there are changes
        if (productFieldsToUpdate.length > 0) {
            productParamsToUpdate.push(productId);
            const updateProductQuery = `UPDATE products SET ${productFieldsToUpdate.join(', ')} WHERE product_id = ?`;
            
            const updateProductResult = await query(updateProductQuery, productParamsToUpdate);
            console.log(`[PRODUCT UPDATE] Updated basic product info, affected rows: ${updateProductResult.affectedRows}`);
        } else {
            console.log(`[PRODUCT UPDATE] No changes to basic product info`);
        }
        
        // Process variants
        const variantData = {};
        let variantFieldPattern = /variants\[(\d+)\]\[([^\]]+)\]/;
        
        for (const key in req.body) {
            const matches = key.match(variantFieldPattern);
            if (matches) {
                const [_, index, field] = matches;
                if (!variantData[index]) variantData[index] = {};
                variantData[index][field] = req.body[key];
            }
        }
        
        // Process variants (create, update, delete)
        console.log(`[PRODUCT UPDATE] Processing ${Object.keys(variantData).length} variants`);
        
        for (const index in variantData) {
            const variant = variantData[index];
            const variantId = variant.id;
            const variantName = variant.name;
            const variantPrice = variant.price;
            const variantStock = variant.stock || 0;
            const variantDiscountId = variant.discount_id || null;
            const variantIsBestseller = variant.is_bestseller ? 1 : 0;
            const variantIsStock = variant.is_stock ? 1 : 0;
            const variantIsDisplay = variant.is_display ? 1 : 0;
            
            if (!variantName || !variantPrice) {
                console.log(`[PRODUCT UPDATE] Skipping variant with missing required fields`);
                continue;
            }
            
            if (variantId) {
                // Update existing variant
                await query(
                    `UPDATE product_variants SET 
                     product_variant_name = ?, 
                     product_variant_price = ?, 
                     product_variant_available = ?,
                     discount_id = ?,
                     product_variant_is_bestseller = ?,
                     product_variant_is_stock = ?,
                     product_variant_is_display = ?
                     WHERE product_variant_id = ?`,
                    [
                        variantName, 
                        variantPrice, 
                        variantStock, 
                        variantDiscountId,
                        variantIsBestseller,
                        variantIsStock,
                        variantIsDisplay,
                        variantId
                    ]
                );
                console.log(`[PRODUCT UPDATE] Updated variant #${variantId}: ${variantName} - ${variantPrice}`);
            } else if (variantName && variantPrice) {
                // Create new variant
                const result = await query(
                    `INSERT INTO product_variants 
                     (product_id, product_variant_name, product_variant_price, product_variant_available, 
                      discount_id, product_variant_is_bestseller, product_variant_is_stock, 
                      product_variant_is_display, product_variant_added_date) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        productId, 
                        variantName, 
                        variantPrice, 
                        variantStock,
                        variantDiscountId,
                        variantIsBestseller,
                        variantIsStock,
                        variantIsDisplay
                    ]
                );
                console.log(`[PRODUCT UPDATE] Created new variant #${result.insertId}: ${variantName} - ${variantPrice}`);
            }
        }
        
        // Check for variants to delete (by comparing existing with submitted)
        const existingVariantsResult = await query(
            'SELECT product_variant_id FROM product_variants WHERE product_id = ?', 
            [productId]
        );
        
        if (existingVariantsResult.length > 0) {
            const existingVariantIds = existingVariantsResult.map(v => v.product_variant_id.toString());
            const submittedVariantIds = Object.values(variantData)
                                            .filter(v => v.id)
                                            .map(v => v.id.toString());
            
            const variantsToDelete = existingVariantIds.filter(id => !submittedVariantIds.includes(id));
            
            if (variantsToDelete.length > 0) {
                await query('DELETE FROM product_variants WHERE product_variant_id IN (?)', [variantsToDelete]);
                console.log(`[PRODUCT UPDATE] Deleted ${variantsToDelete.length} variants: ${variantsToDelete.join(', ')}`);
            }
        }
        
        // Process specifications
        const specData = {};
        let specFieldPattern = /specs\[(\d+)\]\[([^\]]+)\]/;
        
        for (const key in req.body) {
            const matches = key.match(specFieldPattern);
            if (matches) {
                const [_, index, field] = matches;
                if (!specData[index]) specData[index] = {};
                specData[index][field] = req.body[key];
            }
        }
        
        // Process specs (create, update, delete)
        console.log(`[PRODUCT UPDATE] Processing ${Object.keys(specData).length} specifications`);
        
        for (const index in specData) {
            const spec = specData[index];
            const specId = spec.id;
            const specName = spec.name;
            const specValue = spec.value;
            const specUnit = spec.unit || null;
            
            if (!specName || !specValue) continue;
            
            if (specId) {
                // Update existing specification
                await query(
                    'UPDATE product_details SET product_detail_name = ?, product_detail_value = ?, product_detail_unit = ? WHERE product_detail_id = ?',
                    [specName, specValue, specUnit, specId]
                );
                console.log(`[PRODUCT UPDATE] Updated specification #${specId}: ${specName} = ${specValue}`);
            } else {
                // Create new specification
                const result = await query(
                    'INSERT INTO product_details (product_id, product_detail_name, product_detail_value, product_detail_unit) VALUES (?, ?, ?, ?)',
                    [productId, specName, specValue, specUnit]
                );
                console.log(`[PRODUCT UPDATE] Created new specification #${result.insertId}: ${specName} = ${specValue}`);
            }
        }
        
        // Check for specs to delete
        const existingSpecsResult = await query(
            'SELECT product_detail_id FROM product_details WHERE product_id = ?', 
            [productId]
        );
        
        if (existingSpecsResult.length > 0) {
            const existingSpecIds = existingSpecsResult.map(s => s.product_detail_id.toString());
            const submittedSpecIds = Object.values(specData)
                                        .filter(s => s.id)
                                        .map(s => s.id.toString());
            
            const specsToDelete = existingSpecIds.filter(id => !submittedSpecIds.includes(id));
            
            if (specsToDelete.length > 0) {
                await query('DELETE FROM product_details WHERE product_detail_id IN (?)', [specsToDelete]);
                console.log(`[PRODUCT UPDATE] Deleted ${specsToDelete.length} specifications: ${specsToDelete.join(', ')}`);
            }
        }
        
        // Handle image deletions
        if (req.body.delete_images) {
            const imagesToDelete = Array.isArray(req.body.delete_images) 
                ? req.body.delete_images 
                : [req.body.delete_images];
            
            console.log(`[PRODUCT UPDATE] Processing ${imagesToDelete.length} images for deletion`);
            
            for (const imageId of imagesToDelete) {
                // Get image filename before deleting the record
                const imageResult = await query(
                    'SELECT image_name FROM product_imgs WHERE image_id = ? AND product_id = ?', 
                    [imageId, productId]
                );
                
                if (imageResult.length > 0) {
                    const imageName = imageResult[0].image_name;
                    const imagePath = path.join(__dirname, '../public/imgs/product_image/P' + productId, imageName);
                    
                    // Delete the file if it exists
                    try {
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                            console.log(`[PRODUCT UPDATE] Deleted image file: ${imagePath}`);
                        }
                    } catch (err) {
                        console.error(`[PRODUCT UPDATE] Error deleting image file: ${err.message}`);
                    }
                    
                    // Delete the database record
                    await query('DELETE FROM product_imgs WHERE image_id = ?', [imageId]);
                    console.log(`[PRODUCT UPDATE] Deleted image record #${imageId}`);
                }
            }
        }
        
        // Handle new image uploads
        if (req.files) {
            const newImageKeys = Object.keys(req.files).filter(key => key.startsWith('new_image_'));
            
            if (newImageKeys.length > 0) {
                console.log(`[PRODUCT UPDATE] Processing ${newImageKeys.length} new image uploads`);
                
                // Ensure product image directory exists
                const productImgDir = path.join(__dirname, '../public/imgs/product_image/P' + productId);
                if (!fs.existsSync(productImgDir)) {
                    fs.mkdirSync(productImgDir, { recursive: true });
                    console.log(`[PRODUCT UPDATE] Created product image directory: ${productImgDir}`);
                }
                
                // Find highest current image number
                const existingImages = await query('SELECT image_name FROM product_imgs WHERE product_id = ?', [productId]);
                let highestNumber = 0;
                
                existingImages.forEach(img => {
                    const match = img.image_name.match(/P\d+_(\d+)\./);
                    if (match && match[1]) {
                        const num = parseInt(match[1]);
                        if (!isNaN(num) && num > highestNumber) {
                            highestNumber = num;
                        }
                    }
                });
                
                console.log(`[PRODUCT UPDATE] Highest existing image number: ${highestNumber}`);
                
                // Process each new image
                for (const key of newImageKeys) {
                    const imageFile = req.files[key];
                    
                    // Skip empty files
                    if (!imageFile || !imageFile.name || imageFile.size === 0) {
                        console.log(`[PRODUCT UPDATE] Skipping empty file for key: ${key}`);
                        continue;
                    }
                    
                    // Generate a filename with sequential numbering
                    highestNumber++;
                    const fileExt = imageFile.name.split('.').pop().toLowerCase();
                    const fileName = `P${productId}_${highestNumber}.${fileExt}`;
                    const filePath = path.join(productImgDir, fileName);
                    
                    console.log(`[PRODUCT UPDATE] Saving new image: ${fileName}`);
                    
                    try {
                        // Move the uploaded file
                        await imageFile.mv(filePath);
                        
                        // Add to database
                        const result = await query(
                            'INSERT INTO product_imgs (product_id, image_name, image_is_display) VALUES (?, ?, 1)',
                            [productId, fileName]
                        );
                        console.log(`[PRODUCT UPDATE] Saved new image with ID ${result.insertId}: ${fileName}`);
                    } catch (err) {
                        console.error(`[PRODUCT UPDATE] Error saving image: ${err.message}`);
                    }
                }
            }
        }
        
        // Handle avatar image (first image)
        if (changedFields.includes('avatar_changed')) {
            console.log(`[PRODUCT UPDATE] Avatar image has been changed`);
            
            // Get all current images
            const images = await query('SELECT image_id, image_name FROM product_imgs WHERE product_id = ? ORDER BY image_id ASC', [productId]);
            
            if (images.length > 0) {
                // Update product's avatar image to be the first image
                const avatarImage = images[0].image_name;
                await query('UPDATE products SET product_avt_img = ? WHERE product_id = ?', [avatarImage, productId]);
                console.log(`[PRODUCT UPDATE] Updated product avatar image to: ${avatarImage}`);
            }
        }
        
        // Commit the transaction
        await query('COMMIT');
        
        console.log("[PRODUCT UPDATE] Update completed successfully");
        return res.status(200).json({
            status: 'success',
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error("[PRODUCT UPDATE] Error:", error);
        
        // Rollback transaction on error
        try {
            await query('ROLLBACK');
            console.log("[PRODUCT UPDATE] Transaction rolled back");
        } catch (rollbackError) {
            console.error("[PRODUCT UPDATE] Rollback error:", rollbackError);
        }
        
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating the product: ' + error.message
        });
    } finally {
        console.log("[PRODUCT UPDATE] ==============================================\n");
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
      
      // Check if product is used in orders
      const ordersWithProduct = await query(
        'SELECT COUNT(*) as count FROM order_details WHERE product_id = ?', 
        [productId]
      );
      
      if (ordersWithProduct[0].count > 0) {
        await query('ROLLBACK');
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete product that is used in orders'
        });
      }
      
      // Delete product files and data
      const productDir = path.join(__dirname, '../public/imgs/product_image/P' + productId);
      
      if (fs.existsSync(productDir)) {
        fs.rmdirSync(productDir, { recursive: true });
      }
      
      await query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
      await query('DELETE FROM product_details WHERE product_id = ?', [productId]);
      await query('DELETE FROM product_imgs WHERE product_id = ?', [productId]);
      await query('DELETE FROM products WHERE product_id = ?', [productId]);
      
      await query('COMMIT');
      
      return res.status(200).json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      
      try {
        await query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
      
      return res.status(500).json({
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
          message: 'No products selected for deletion'
        });
      }
      
      // Start transaction
      await query('START TRANSACTION');
      
      // Check which products are in orders
      const productsInOrders = await query(
        'SELECT DISTINCT product_id FROM order_details WHERE product_id IN (?)',
        [productIds]
      );
      
      const productsInOrderIds = productsInOrders.map(p => p.product_id);
      const productsToDelete = productIds.filter(id => !productsInOrderIds.includes(parseInt(id)));
      
      console.log(`Products to delete: ${productsToDelete.join(', ')}`);
      console.log(`Products in orders (cannot delete): ${productsInOrderIds.join(', ')}`);
      
      // Delete products that are not in any orders
      for (const productId of productsToDelete) {
        const productDir = path.join(__dirname, '../public/imgs/product_image/P' + productId);
        
        if (fs.existsSync(productDir)) {
          fs.rmdirSync(productDir, { recursive: true });
        }
        
        await query('DELETE FROM product_variants WHERE product_id = ?', [productId]);
        await query('DELETE FROM product_details WHERE product_id = ?', [productId]);
        await query('DELETE FROM product_imgs WHERE product_id = ?', [productId]);
        await query('DELETE FROM products WHERE product_id = ?', [productId]);
      }
      
      await query('COMMIT');
      
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
        SELECT o.*, u.user_fullname, u.user_email, u.user_phone
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

module.exports = new AdminController();