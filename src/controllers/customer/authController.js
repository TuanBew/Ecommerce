const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const util = require("util");
const db = require("../../config/db/connect");
const query = util.promisify(db.query).bind(db);

const index = require("../../models/customer/index.model");
const general = require("../../models/general.model");

const authController = () => {};

// [GET] /auth/login
authController.login = async (req, res) => {
  try {
    // Check if user is already logged in
    if (req.cookies.jwt) {
      try {
        const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
        return res.redirect("/");
      } catch (error) {
        // Invalid token, continue to login page
        res.clearCookie("jwt");
      }
    }

    let header = await index.header(req);
    let formatFunction = await general.formatFunction();

    res.status(200).render("./pages/auth/login", {
      header: header,
      user: null,
      formatFunction: formatFunction,
    });
  } catch (error) {
    console.error("Login page error:", error);
    res.status(500).redirect("/error");
  }
};

// [POST] /auth/login
authController.login_post = async (req, res) => {
  try {
    const phone = req.body.phoneNumber || req.body.user_phone || "";
    const password = req.body.password || req.body.user_password || "";

    // Debug log
    console.log("Login POST:", { phone, password });

    if (!phone || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Vui lòng nhập số điện thoại và mật khẩu",
      });
    }

    // Try to find user by phone or login name
    const users = await query(
      "SELECT * FROM users WHERE user_phone = ? OR user_login_name = ? LIMIT 1",
      [phone, phone]
    );
    if (users.length === 0) {
      console.log("No user found with phone or login name:", phone);
      return res.status(401).json({
        status: "fail",
        message: "Số điện thoại hoặc mật khẩu không chính xác",
      });
    }

    const user = users[0];

    // Check password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.user_password
    );
    if (!isPasswordCorrect) {
      console.log("Password mismatch for user:", phone);
      return res.status(401).json({
        status: "fail",
        message: "Số điện thoại hoặc mật khẩu không chính xác",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    // Set cookie
    res.cookie("jwt", token, {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      path: "/",
    });

    // Success
    return res.status(200).json({
      status: "success",
      message: "Đăng nhập thành công",
      redirectUrl: "/",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: "error",
      message: "Đã xảy ra lỗi khi đăng nhập",
    });
  }
};

// [GET] /auth/register
authController.register = async (req, res) => {
  try {
    // Check if user is already logged in
    if (req.cookies.jwt) {
      try {
        const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
        return res.redirect("/");
      } catch (error) {
        // Invalid token, continue to register page
        res.clearCookie("jwt");
      }
    }

    let header = await index.header(req);
    let formatFunction = await general.formatFunction();

    res.status(200).render("./pages/auth/register", {
      header: header,
      user: null,
      formatFunction: formatFunction,
    });
  } catch (error) {
    console.error("Register page error:", error);
    res.status(500).redirect("/error");
  }
};

// [POST] /auth/register
authController.register_post = async (req, res) => {
  try {
    const fullname = req.body.userName; // Họ tên
    const username = req.body.username; // Tên đăng nhập
    const phoneNumber = req.body.phoneNumber;
    const password = req.body.password;
    const confirmPassword = req.body.passwordRepeat;

    if (!fullname || !username || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Vui lòng nhập đầy đủ thông tin",
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Mật khẩu không khớp",
      });
    }

    // Check for duplicates (user_login_name, user_name, user_phone)
    const duplicate = await query(
      `SELECT * FROM users WHERE user_login_name = ? OR user_name = ? OR user_phone = ? LIMIT 1`,
      [username, fullname, phoneNumber]
    );
    if (duplicate.length > 0) {
      let msg = "Thông tin đã được sử dụng: ";
      if (duplicate[0].user_login_name === username) msg += "Tên đăng nhập, ";
      if (duplicate[0].user_name === fullname) msg += "Họ tên, ";
      if (duplicate[0].user_phone === phoneNumber) msg += "Số điện thoại, ";
      msg = msg.replace(/, $/, "");
      return res.status(409).json({
        status: "fail",
        message: msg,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user (remove role_id)
    const insertUser = `
            INSERT INTO users (user_login_name, user_password, user_name, user_phone, user_register_date)
            VALUES (?, ?, ?, ?, NOW())
        `;
    const result = await query(insertUser, [username, hashedPassword, fullname, phoneNumber]);

    // Insert into customers table if needed
    const userId = result.insertId;
    await query("INSERT INTO customers (user_id) VALUES (?)", [userId]);

    // Auto-login: create JWT and set cookie (remove role_id)
    const token = jwt.sign(
      { user_id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );
    res.cookie("jwt", token, {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      path: "/",
    });

    // Success
    return res.status(201).json({
      status: "success",
      message: "Đăng ký thành công!",
      redirectUrl: "/",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      status: "error",
      message: "Đã xảy ra lỗi khi đăng ký",
    });
  }
};

// [GET] /auth/logout
authController.logout = (req, res) => {
  res.clearCookie("jwt", { path: "/" });
  res.redirect("/");
};

module.exports = authController;
