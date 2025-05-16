const general = require('../../models/general.model')
const cate = require('../../models/admin/cateAdmin.model')
const fs = require('fs')
const path = require('path')

const cateAdminController = () => { }

// [GET] /categories_admin/searchkey=?&page=?
cateAdminController.getCategories = async (req, res) => {
    const title = 'QUẢN LÝ DANH MỤC SẢN PHẨM'
    // lấy từ khóa searchKey=?
    let admin = req.admin
    let searchKey = req.query.searchKey
    let page = req.query.page ? req.query.page : 1
    let limit = 10

    let categories = await cate.getCategories(searchKey, page, limit)
    let formatFunction = await general.formatFunction()

    res.status(200).render('admin/pages/cate_admin', {
        title: title,
        admin: admin,
        data: categories,
        formatFunction: formatFunction,
    })
}

// [GET] /categories_admin/edit/:id
cateAdminController.editCategory = async (req, res) => {
    const title = 'SỬA DANH MỤC SẢN PHẨM'
    let admin = req.admin
    let categoryId = req.params.id
    
    let category = await cate.getCategoryById(categoryId)
    let formatFunction = await general.formatFunction()
    
    if (!category) {
        return res.status(404).render('admin/pages/error', {
            title: 'Lỗi - Không tìm thấy danh mục',
            admin: admin,
            message: 'Không tìm thấy danh mục với ID đã cung cấp.'
        })
    }

    res.status(200).render('admin/pages/cate_edit_admin', {
        title: title,
        admin: admin,
        category: category,
        formatFunction: formatFunction,
    })
}

// [POST] /categories_admin/add
cateAdminController.postAddCategory = async (req, res) => {
    try {
        const categoryName = req.body.categoryName
        let categoryImg = 'default.png'

        // Handle file upload if exists
        if (req.files && req.files.image) {
            const file = req.files.image
            const filename = Date.now() + '_' + file.name
            categoryImg = filename

            // Ensure the directory exists
            const uploadPath = path.join(__dirname, '../../public/imgs/categories')
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true })
            }

            // Move the uploaded file to categories folder
            const filePath = path.join(uploadPath, filename)
            await file.mv(filePath)
        } 
        
        if (!categoryName) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Vui lòng nhập tên danh mục'
            })
        }
        
        if (!req.files || !req.files.image) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Vui lòng chọn ảnh cho danh mục'
            })
        }

        const result = await cate.addCategory(categoryName, categoryImg)
        
        if (result) {
            return res.status(201).json({ 
                status: 'success',
                message: 'Thêm danh mục thành công'
            })
        } else {
            return res.status(400).json({ 
                status: 'error',
                message: 'Thêm danh mục thất bại'
            })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ 
            status: 'error',
            message: 'Đã xảy ra lỗi khi thêm danh mục'
        })
    }
}

// [POST] /categories_admin/edit/:id
cateAdminController.postEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const categoryName = req.body.categoryName;
        const categoryType = req.body.categoryType;
        let categoryImg = null;
        
        // Check if the category exists
        const existingCategory = await cate.getCategoryById(categoryId);
        if (!existingCategory) {
            return res.status(404).json({ 
                status: 'error',
                message: 'Không tìm thấy danh mục với ID đã cung cấp'
            });
        }

        // Handle file upload if exists
        if (req.files && req.files.image) {
            const file = req.files.image;
            const filename = Date.now() + '_' + file.name;
            categoryImg = filename;

            // Ensure the directory exists
            const uploadPath = path.join(__dirname, '../../public/imgs/categories');
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            // Move the uploaded file to categories folder
            const filePath = path.join(uploadPath, filename);
            await file.mv(filePath);
        }
        
        // If no name or type provided
        if (!categoryName || !categoryType) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        const result = await cate.updateCategory(categoryId, categoryName, categoryImg, categoryType);
        
        if (result) {
            return res.status(200).json({ 
                status: 'success',
                message: 'Cập nhật danh mục thành công'
            });
        } else {
            return res.status(400).json({ 
                status: 'error',
                message: 'Cập nhật danh mục thất bại'
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            status: 'error',
            message: 'Đã xảy ra lỗi khi cập nhật danh mục'
        });
    }
}

// [GET] /categories_admin/searchkey=?&page=?
cateAdminController.getProducts = async (req, res) => {
    const title = 'QUẢN LÝ SẢN PHẨM'
    // lấy từ khóa searchKey=?
    let admin = req.admin
    let searchKey = req.query.searchKey
    let page = req.query.page ? req.query.page : 1
    let limit = 10

    let products = await cate.getProducts(searchKey, page, limit)
    let formatFunction = await general.formatFunction()

    res.status(200).render('admin/pages/product_admin', {
        title: title,
        admin: admin,
        data: products,
        formatFunction: formatFunction,
    })
}

cateAdminController.addCategories = async (req, res) => {
    const title = 'QUẢN LÝ DANH MỤC SẢN PHẨM'
    // lấy từ khóa searchKey=?
    let admin = req.admin

    let formatFunction = await general.formatFunction()

    res.status(200).render('admin/pages/cate_view_admin', {
        title: title,
        admin: admin,
        formatFunction: formatFunction,
    })
}

cateAdminController.addProducts = async (req, res) => {
    const title = 'QUẢN LÝ SẢN PHẨM'
    // lấy từ khóa searchKey=?
    let admin = req.admin

    let categories = await general.getCates()
    let formatFunction = await general.formatFunction()

    res.status(200).render('admin/pages/product_view_admin', {
        title: title,
        admin: admin,
        categories: categories,
        formatFunction: formatFunction,
    })
}

// [POST] /categories_admin/delete/:id
cateAdminController.deleteCategory = async (req, res) => {
}

module.exports = cateAdminController