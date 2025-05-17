const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv').config();

// Create a simple express app to test routes
const app = express();
const port = 3001; // Use a different port than your main app

// Add necessary middleware for form handling
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// The route we want to test
app.post('/admin/products_admin/update/:id', (req, res) => {
  console.log('Route matched!');
  console.log('Product ID from params:', req.params.id);
  console.log('Request body:', req.body);
  res.json({ status: 'success', message: 'Route is working correctly' });
});

// Add test route for GET request
app.get('/test', (req, res) => {
  res.send(`
    <h1>Route Test Form</h1>
    <form action="/admin/products_admin/update/123" method="POST">
      <input type="hidden" name="product_id" value="123">
      <input type="text" name="product_name" value="Test Product">
      <button type="submit">Test Route</button>
    </form>
  `);
});

// Print available routes
const listRoutes = () => {
  console.log('Available routes:');
  app._router.stack.forEach((middleware) => {
    if (middleware.route) { // routes registered directly on the app
      console.log(`${Object.keys(middleware.route.methods).join(', ')} ${middleware.route.path}`);
    } else if (middleware.name === 'router') { // router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods).join(', ');
          console.log(`${methods} ${path}`);
        }
      });
    }
  });
};

// Read the main routes file
console.log('\nAnalyzing routes in admin.js:');
try {
  const routesFile = fs.readFileSync(path.join(__dirname, 'src', 'routes', 'admin.js'), 'utf8');
  console.log('Admin routes file content:');
  const routes = routesFile.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g) || [];
  routes.forEach(route => {
    console.log('- ' + route.replace(/router\.(get|post|put|delete|patch)\s*\(\s*['"]/, '').replace(/['"]$/, ''));
  });
} catch (err) {
  console.error('Error reading routes file:', err);
}

app.listen(port, () => {
  console.log(`Diagnostic server listening at http://localhost:${port}/test`);
  listRoutes();
});
