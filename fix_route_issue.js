const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3003;

// Apply middlewares similar to our main app
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    createParentPath: true,
    debug: true
}));

// Create a mock admin router
const adminRouter = express.Router();

// Add test product update route
adminRouter.post('/products_admin/update/:id', (req, res) => {
    console.log('Route matched!', {
        params: req.params,
        body: Object.keys(req.body),
        files: req.files ? Object.keys(req.files) : []
    });
    
    res.json({
        status: 'success',
        message: 'Product updated successfully',
        productId: req.params.id
    });
});

// Mount the admin router at /admin
app.use('/admin', adminRouter);

// Create a test form
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>Route Fix Test</title></head>
        <body>
            <h1>Product Update Test</h1>
            <form id="testForm" enctype="multipart/form-data">
                <input type="hidden" name="product_id" value="51">
                <div>
                    <label>Product Name</label>
                    <input type="text" name="product_name" value="Test Product">
                </div>
                <div>
                    <label>Upload Test Image</label>
                    <input type="file" name="new_image_1">
                </div>
                <button type="button" onclick="submitForm()">Submit Form</button>
            </form>
            
            <div id="result" style="margin-top: 20px; padding: 10px; border: 1px solid #ccc;"></div>
            
            <script>
                function submitForm() {
                    const form = document.getElementById('testForm');
                    const formData = new FormData(form);
                    const productId = formData.get('product_id');
                    
                    document.getElementById('result').innerHTML = 'Sending request...';
                    
                    fetch('/admin/products_admin/update/' + productId, {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('result').innerHTML = 
                            '<h3>Success!</h3><pre>' + JSON.stringify(data, null, 2) + '</pre>';
                    })
                    .catch(error => {
                        document.getElementById('result').innerHTML = 
                            '<h3>Error!</h3><pre>' + error + '</pre>';
                    });
                }
            </script>
        </body>
        </html>
    `);
});

// Start server
app.listen(port, () => {
    console.log(`Route fix test server running at http://localhost:${port}/`);
    console.log('This should help diagnose and fix route matching issues');
});
