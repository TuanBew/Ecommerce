// Same as update_categories.js but with the new SQL file
const mysql = require('mysql');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv').config();

// Create a database connection
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
  console.log('Connected to the database');
  
  // Read the SQL file
  const sqlFilePath = path.join(__dirname, 'src', 'config', 'db', 'category_update_fixed.sql');
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Split SQL statements
  const statements = sqlScript
    .split(';')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0);
  
  // Execute each statement
  statements.forEach((statement, index) => {
    db.query(statement, (err, result) => {
      if (err) {
        console.error(`Error executing statement ${index + 1}:`, err);
        return;
      }
      console.log(`Statement ${index + 1} executed successfully: ${statement}`);
      console.log('Affected rows:', result.affectedRows);
      
      // Close the connection after the last query
      if (index === statements.length - 1) {
        console.log('All updates completed successfully');
        db.end();
      }
    });
  });
});
