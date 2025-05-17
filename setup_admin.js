const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv').config();
const util = require('util');

// Create database connection
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

// Promisify query function
const query = util.promisify(db.query).bind(db);

async function setupAdmin() {
  try {
    console.log('Checking if admin table exists...');
    
    // Check if admin table exists
    const tables = await query("SHOW TABLES LIKE 'admin'");
    
    if (tables.length === 0) {
      console.log('Creating admin table...');
      await query(`
        CREATE TABLE admin (
          admin_id INT AUTO_INCREMENT PRIMARY KEY,
          admin_fullname VARCHAR(255) NOT NULL,
          admin_login_name VARCHAR(255) NOT NULL UNIQUE,
          admin_password VARCHAR(255) NOT NULL,
          admin_email VARCHAR(255),
          admin_phone VARCHAR(20),
          admin_created_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Admin table created successfully');
    } else {
      console.log('Admin table already exists');
    }
    
    // Check if default admin exists
    console.log('Checking if default admin exists...');
    const adminExists = await query("SELECT * FROM admin WHERE admin_login_name = 'admin'");
    
    if (adminExists.length === 0) {
      // Create default admin account
      console.log('Creating default admin account...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await query(`
        INSERT INTO admin (admin_fullname, admin_login_name, admin_password, admin_email)
        VALUES ('Administrator', 'admin', ?, 'admin@techtwo.com')
      `, [hashedPassword]);
      
      console.log('Default admin account created:');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Default admin account already exists');
    }
    
    console.log('Admin setup completed successfully');
  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    db.end();
  }
}

setupAdmin();
