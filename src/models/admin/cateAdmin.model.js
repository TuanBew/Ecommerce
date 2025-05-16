const db = require('../../config/db/connect');
const util = require('node:util')
const query = util.promisify(db.query).bind(db)
const general = require('../general.model');
const indexAdmin = require('./indexAdmin.model');
const product = require('../customer/product.model');

const cateAdmin = function () { }

// Get all categories with pagination and search
cateAdmin.getCategories = async (searchKey, page, limit) => {
    let getRowSQL = "SELECT COUNT(*) as total FROM view_cate_admin"
    let getCateSQL = "SELECT * FROM view_cate_admin"
    if (searchKey) {
        getCateSQL += " WHERE view_cate_admin.category_name LIKE '%" + searchKey + "%'"
        getCateSQL += " OR view_cate_admin.category_id LIKE '%" + searchKey + "%'"
        getRowSQL += " WHERE view_cate_admin.category_name LIKE '%" + searchKey + "%'"
        getRowSQL += " OR view_cate_admin.category_id LIKE '%" + searchKey + "%'"
    }

    //truy vấn tính tổng số dòng trong một bảng
    let rowData = await query(getRowSQL)
    let totalRow = rowData[0].total

    // tính số trang thực tế sẽ có
    let totalPage = totalRow > 0 ? Math.ceil(totalRow / limit) : 1
    // Kiểm tra đảm bảo rằng page là số nguyên hợp lệ từ 1 đến totalPage
    page = page > 0 ? Math.floor(page) : 1
    page = page <= totalPage ? Math.floor(page) : totalPage

    let start = (page - 1) * limit

    getCateSQL += " ORDER BY view_cate_admin.category_id LIMIT " + start + "," + limit;

    return new Promise((resolve, reject) => {
        db.query(getCateSQL, (err, cate) => {
            if (err) reject(err);
            let categories = {
                categories: cate,
                searchKey: searchKey,
                totalRow: totalRow,
                totalPage: totalPage,
                page: parseInt(page),
                limit: limit,
            }
            resolve(categories)
        })
    })
}

// Get category by ID
cateAdmin.getCategoryById = async (categoryId) => {
    try {
        let getCategory = `SELECT * FROM categories WHERE category_id = ${categoryId}`;
        let result = await query(getCategory);
        
        if (result.length > 0) {
            return result[0];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        return null;
    }
}

// Add a new category
cateAdmin.addCategory = async (categoryName, categoryImg) => {
    try {
        let categoryType = 'Điện máy'; // Default type
        let insertCategory = `INSERT INTO categories (category_name, category_img, categorry_type) 
                             VALUES (?, ?, ?)`;
        let result = await query(insertCategory, [categoryName, categoryImg, categoryType]);
        
        return result.insertId > 0;
    } catch (error) {
        console.error('Error adding category:', error);
        return false;
    }
}

// Update an existing category
cateAdmin.updateCategory = async (categoryId, categoryName, categoryImg, categoryType) => {
    try {
        let updateQuery = '';
        let params = [];
        
        // If image is provided, update both name, type and image
        if (categoryImg) {
            updateQuery = `UPDATE categories SET category_name = ?, categorry_type = ?, category_img = ? WHERE category_id = ?`;
            params = [categoryName, categoryType, categoryImg, categoryId];
        } else {
            // Otherwise update only the name and type
            updateQuery = `UPDATE categories SET category_name = ?, categorry_type = ? WHERE category_id = ?`;
            params = [categoryName, categoryType, categoryId];
        }
        
        let result = await query(updateQuery, params);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error updating category:', error);
        return false;
    }
}

// Get all products with pagination and search
cateAdmin.getProducts = async (searchKey, page, limit) => {
    let getRowSQL = "SELECT COUNT(*) as total FROM view_products_admin"
    let getProductSQL = "SELECT * FROM view_products_admin"
    if (searchKey) {
        getProductSQL += " WHERE view_products_admin.product_name LIKE '%" + searchKey + "%'"
        getProductSQL += " OR view_products_admin.product_id LIKE '%" + searchKey + "%'"
        getRowSQL += " WHERE view_products_admin.product_name LIKE '%" + searchKey + "%'"
        getRowSQL += " OR view_products_admin.product_id LIKE '%" + searchKey + "%'"
    }

    //truy vấn tính tổng số dòng trong một bảng
    let rowData = await query(getRowSQL)
    let totalRow = rowData[0].total

    // tính số trang thực tế sẽ có
    let totalPage = totalRow > 0 ? Math.ceil(totalRow / limit) : 1
    // Kiểm tra đảm bảo rằng page là số nguyên hợp lệ từ 1 đến totalPage
    page = page > 0 ? Math.floor(page) : 1
    page = page <= totalPage ? Math.floor(page) : totalPage

    let start = (page - 1) * limit

    getProductSQL += " ORDER BY view_products_admin.revenue DESC LIMIT " + start + "," + limit;

    return new Promise((resolve, reject) => {
        db.query(getProductSQL, (err, product) => {
            if (err) reject(err);
            let products = {
                products: product,
                searchKey: searchKey,
                totalRow: totalRow,
                totalPage: totalPage,
                page: parseInt(page),
                limit: limit,
            }
            resolve(products)
        })
    })
}

module.exports = cateAdmin