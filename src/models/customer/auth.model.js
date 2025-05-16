const db = require('../../config/db/connect');
const util = require('util');
const query = util.promisify(db.query).bind(db);
const bcrypt = require('bcryptjs')

const auth = function () { }

auth.registerPost = async (req, callback) => {
    const {
        user_login_name,
        user_phone,
        user_password
    } = req.body

    db.query('SELECT user_phone FROM users WHERE user_phone = ?', [user_phone], async (err, result) => {
        if (err) callback(1, 0, 0)
        if (result[0]) {
            callback(0, 1, 0)
        } else {
            let hashedPassword = await bcrypt.hash(user_password, 8);

            db.query('INSERT INTO users SET ?', [{
                user_login_name: user_phone,
                user_phone: user_phone,
                user_name: user_login_name,
                user_password: hashedPassword,
                user_register_date: new Date(),
                user_active: 1
            }], async (error, results) => {
                if (err) callback(1, 0, 0)
                callback(0, 0, 1)
            })
        }
    })
}

auth.loginPost = async (req, callback) => {
    const user_phone = req.body.phoneNumber;
    const user_password = req.body.password;

    db.query('SELECT *  FROM users WHERE user_phone = ?', [user_phone], async (err, result) => {
        if (err) callback(1, 0, 0, 0, 0)
        if (!result.length) callback(0, 1, 0, 0, 0)
        else if (!await bcrypt.compare(user_password, result[0].user_password)) {
            callback(0, 0, 1, 0, 0)
        } else {
            const id = result[0].user_id;
            callback(0, 0, 0, 1, id)
        }
    })
}

auth.findNumberPhone = async (req, callback) => {
    const user_phone = req.body.user_phone;

    db.query('SELECT *  FROM users WHERE user_phone = ?', [user_phone], async (err, result) => {
        if (err) callback(1, 0, 0, 0)
        if (!result.length) callback(0, 1, 0, 0)
        else {
            const id = result[0].user_id;
            callback(0, 0, 1, id)
        }
    })
}

auth.checkPhone = (phone, callback) => {
    const sql = `
        SELECT *
        FROM USERS
        WHERE user_phone = ?`
    db.query(sql, [phone], (err, result) => {
        callback(err, result)
    })
}

auth.checkOldPassword = async ( user_old_password, user_password , callback) => {
    console.log(user_old_password, user_password)
    if (!await bcrypt.compare(user_old_password, user_password)){
        callback(1, 0)
    } else {
        callback(0, 1)
    }
}

auth.resetPassword = async (phone, password, callback) => {
    const hashedPass = await bcrypt.hash(password, 8)
    const sql = `
        UPDATE USERS
        SET user_password = '${hashedPass}'
        WHERE user_phone = '${phone}';`;
    db.query(sql, (err, result) => {
        callback(err, result)
    })
}

// Get user by email
auth.getUserByEmail = async (email) => {
    try {
        const getUserQuery = `
            SELECT * FROM users
            WHERE user_email = ?
            LIMIT 1
        `;
        
        const users = await query(getUserQuery, [email]);
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error("Error getting user by email:", error);
        return null;
    }
};

// Create new user
auth.createUser = async (userData) => {
    try {
        // Insert into users table
        const insertUserQuery = `
            INSERT INTO users (
                user_fullname,
                user_email,
                user_password,
                user_phone,
                role_id,
                user_created_date
            ) VALUES (?, ?, ?, ?, 2, NOW())
        `;
        
        const userResult = await query(insertUserQuery, [
            userData.fullname,
            userData.email,
            userData.password,
            userData.phone
        ]);
        
        const userId = userResult.insertId;
        
        // Insert into customers table
        const insertCustomerQuery = `
            INSERT INTO customers (user_id) VALUES (?)
        `;
        
        await query(insertCustomerQuery, [userId]);
        
        // Get the newly created user
        const getNewUserQuery = `
            SELECT u.*, c.customer_id
            FROM users u
            JOIN customers c ON u.user_id = c.user_id
            WHERE u.user_id = ?
            LIMIT 1
        `;
        
        const newUsers = await query(getNewUserQuery, [userId]);
        return newUsers.length > 0 ? newUsers[0] : null;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

// Get user by phone
auth.getUserByPhone = async (phone) => {
    try {
        const getUserQuery = `
            SELECT users.*, customers.customer_id
            FROM users
            LEFT JOIN customers ON users.user_id = customers.user_id
            WHERE user_phone = ?
            LIMIT 1
        `;
        
        const users = await query(getUserQuery, [phone]);
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error("Error getting user by phone:", error);
        return null;
    }
};

module.exports = auth