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
    
    // Check if our target category types exist
    const targetTypes = ['Laptop', 'PC', 'Linh Kiện', 'Gaming Gear'];
    const foundTypes = [];
    
    // Get unique category types from results
    const uniqueTypes = [...new Set(results.map(cat => cat.categorry_type))];
    
    // Check which target types exist
    targetTypes.forEach(type => {
      if (uniqueTypes.includes(type)) {
        foundTypes.push(type);
      }
    });
    
    console.log(`\nFound ${foundTypes.length} out of ${targetTypes.length} target category types:`);
    console.table(foundTypes);
    
    // Group categories by type
    const categoriesByType = {};
    results.forEach(cat => {
      if (!categoriesByType[cat.categorry_type]) {
        categoriesByType[cat.categorry_type] = [];
      }
      categoriesByType[cat.categorry_type].push(cat);
    });
    
    console.log('\nCategories grouped by type:');
    for (const type in categoriesByType) {
      console.log(`\n${type} (${categoriesByType[type].length} items):`);
      console.table(categoriesByType[type].map(cat => ({ id: cat.category_id, name: cat.category_name })));
    }
    
    // Close connection
    db.end();
  });
});
