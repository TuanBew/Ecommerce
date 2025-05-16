const db = require('../../config/db/connect')
const util = require('node:util')
const jwt = require('jsonwebtoken')
const query = util.promisify(db.query).bind(db)
const general = require('../general.model')
const index = require('./index.model')


const account = function () { }


account.updateInfo = async (req, res) => {
    const updateInfo = `
        UPDATE users 
        SET 
            user_login_name = ?,
            user_name = ?,
            user_birth = ?,
            user_sex = ?,
            user_email = ?,
            user_phone = ?,
            user_address = ?
        WHERE user_id = ?
    `

    const values = [
        req.body.user_phone,
        req.body.user_name,
        // new Date(req.body.user_birth),
        req.body.user_birth,
        req.body.user_sex,
        req.body.user_email,
        req.body.user_phone,
        req.body.user_address,
        req.user.user_id
    ]

    const result = await query(updateInfo, values)

}


account.checkPassword = async (req, callback) => {
    const user_password = req.body.user_password
    const user_id = req.user.user_id

    db.query('SELECT *  FROM users WHERE user_id = ?', [user_id], async (err, result) => {
        if (err) callback(1, 0, 0)
        if (!await bcrypt.compare(user_password, result[0].user_password)) {
            callback(0, 1, 0)
        } else {
            callback(0, 0, 1)
        }
    })
}

account.getPurchaseHistory = async (customer_id, order_status, order_id) => {
    let getPurchaseHistorys = `SELECT * 
                                FROM view_orders
                                WHERE customer_id = ${customer_id}`

    if (order_id) {
        getPurchaseHistorys += ` AND order_id = ${order_id}`
    }
    if (order_status) {
        getPurchaseHistorys += ` AND order_status = '${order_status}'`
    }

    getPurchaseHistorys += ` ORDER BY order_date DESC, order_id DESC`

    let purchaseHistorys = await query(getPurchaseHistorys)

    return new Promise(async (resolve, reject) => {
        const promises = []
        purchaseHistorys.forEach(async (purchaseHistory) => {
            promises.push(
                account.getDetailPurchaseHistorys(purchaseHistory.order_id, customer_id).then((order_details) => {
                    purchaseHistory.order_details = order_details
                })
            )
        })
        await Promise.all(promises)
        resolve(purchaseHistorys)
    })
}

account.getDetailPurchaseHistorys = async (order_id, customer_id) => {
    let getDetailPurchaseHistorys = `SELECT * FROM view_order_detail WHERE order_id = ${order_id}`
    let detailPurchaseHistorys = await query(getDetailPurchaseHistorys)

    return new Promise(async (resolve, reject) => {
        const promises = []
        detailPurchaseHistorys.forEach(async (detailPurchaseHistory) => {
            promises.push(
                account.viewFeedback(customer_id, detailPurchaseHistory.order_id, detailPurchaseHistory.product_variant_id).then((feedback) => {
                    detailPurchaseHistory.feedback = feedback
                })
            )
        })
        await Promise.all(promises)
        resolve(detailPurchaseHistorys)
    })
}

account.insertFeedback = async (product_variant_id, customer_id, order_id, feedback_rate, feedback_content, callback) => {
    if (feedback_content == '') feedback_content = 'Bạn không để lại lời nhận xét nào'
    let insertFeedback = `INSERT INTO feedbacks (product_variant_id, customer_id, order_id, feedback_rate, feedback_content) VALUES (${product_variant_id}, ${customer_id}, ${order_id}, ${feedback_rate}, ?)`

    db.query(insertFeedback, [feedback_content], (err, result) => {
        if (err) {
            console.log(err)
            callback(1, 0)
        } else {
            callback(0, 1)
        }
    })
}

account.viewFeedback = async (customer_id, order_id, product_variant_id) => {
    let viewFeedback = `SELECT * FROM feedbacks WHERE customer_id = ${customer_id} AND order_id = ${order_id} AND product_variant_id = ${product_variant_id};`
    let feedback = await query(viewFeedback)

    if (!feedback[0]) {
        return 0
    } else {
        return feedback[0]
    }  
}

// Get user orders
account.getOrders = async (customerId) => {
    try {
        const getOrders = `
            SELECT * FROM orders 
            WHERE customer_id = ? 
            ORDER BY order_date DESC
        `;
        const orders = await query(getOrders, [customerId]);
        return orders;
    } catch (error) {
        console.error("Error getting orders:", error);
        return [];
    }
}

// Get order details
account.getOrderDetails = async (orderId, userId) => {
    try {
        // Get order
        const getOrder = `
            SELECT * FROM orders 
            WHERE order_id = ? AND user_id = ?
        `;
        const orders = await query(getOrder, [orderId, userId]);
        
        if (orders.length === 0) {
            return null;
        }
        
        // Get order items
        const getOrderItems = `
            SELECT od.*, p.product_name, p.product_price, pi.image_name
            FROM order_details od
            JOIN products p ON od.product_id = p.product_id
            LEFT JOIN (
                SELECT product_id, MIN(image_id) as min_image_id, image_name
                FROM product_images
                GROUP BY product_id
            ) pi ON p.product_id = pi.product_id
            WHERE od.order_id = ?
        `;
        
        const orderItems = await query(getOrderItems, [orderId]);
        
        return {
            orderInfo: orders[0],
            items: orderItems
        };
    } catch (error) {
        console.error("Error getting order details:", error);
        return null;
    }
}

// Update user information
account.updateUserInfo = async (userId, userData) => {
    try {
        const updateUser = `
            UPDATE users 
            SET user_fullname = ?, user_phone = ?, user_address = ?
            WHERE user_id = ?
        `;
        
        await query(updateUser, [
            userData.fullname,
            userData.phone,
            userData.address,
            userId
        ]);
        
        return true;
    } catch (error) {
        console.error("Error updating user information:", error);
        return false;
    }
}

module.exports = account