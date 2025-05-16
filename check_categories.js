const mysql = require('mysql');
const dotenv = require('dotenv').config();

// Create database connection
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  
  console.log('Connected to the database');
  
  // Query to check all categories
  const query = 'SELECT * FROM categories';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return;
    }
    
    console.log('Current categories in database:');
    console.table(results);
    
    // Check if our target categories exist
    const targetCategories = ['Laptop', 'PC', 'Linh Kiện', 'Gaming Gear'];
    const foundCategories = results.filter(cat => targetCategories.includes(cat.category_name));
    
    console.log(`\nFound ${foundCategories.length} out of ${targetCategories.length} target categories:`);
    console.table(foundCategories);
    
    // Close connection
    db.end();
  });
});
