const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

// Create express app
const app = express();
const port = 3002;

// Configure file upload
app.use(fileUpload({
    createParentPath: true,
    debug: true,
    limits: { fileSize: 50 * 1024 * 1024 }
}));

// Parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - Log all requests
app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files:', req.files ? Object.keys(req.files) : 'None');
    next();
});

// Create a test HTML form for testing the upload
app.get('/', (req, res) => {
    res.send(`
        <html>
        <body>
            <h1>Product Update Test Form</h1>
            <form action="/admin/products_admin/update/51" method="post" enctype="multipart/form-data">
                <div>
                    <label>Product Name</label>
                    <input type="text" name="product_name" value="Test Product">
                </div>
                <div>
                    <label>Category ID</label>
                    <input type="text" name="category_id" value="1">
                </div>
                <div>
                    <label>Description</label>
                    <textarea name="product_description">Test description</textarea>
                </div>
                <div>
                    <label>
                        <input type="checkbox" name="product_is_display" checked>
                        Display Product
                    </label>
                </div>
                <div>
                    <label>Upload Test Image</label>
                    <input type="file" name="new_image_1">
                </div>
                <button type="submit">Submit Form</button>
            </form>
        </body>
        </html>
    `);
});

// Setup test route that mimics the product update endpoint
app.post('/admin/products_admin/update/:id', (req, res) => {
    // Log detailed information
    console.log('\n==== TEST ENDPOINT HIT ====');
    console.log('Product ID:', req.params.id);
    console.log('Form data:', req.body);
    
    // Handle file upload test
    if (req.files) {
        console.log('Files received:');
        Object.keys(req.files).forEach(key => {
            const file = req.files[key];
            console.log(`- ${key}: ${file.name} (${file.mimetype}, ${file.size} bytes)`);
            
            // Test saving the file
            const uploadPath = path.join(__dirname, 'tmp', file.name);
            
            try {
                file.mv(uploadPath, (err) => {
                    if (err) {
                        console.error('Error moving file:', err);
                    } else {
                        console.log(`File saved successfully to: ${uploadPath}`);
                    }
                });
            } catch (error) {
                console.error('Error in file.mv:', error);
            }
        });
    }
    
    // Return success response
    res.json({
        status: 'success',
        message: 'Test endpoint successful',
        receivedData: {
            params: req.params,
            body: req.body,
            files: req.files ? Object.keys(req.files) : []
        }
    });
});

// Make the test directory
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

// Start server
app.listen(port, () => {
    console.log(`Diagnostic server running at http://localhost:${port}/`);
    console.log(`Try submitting the form to test file uploads`);
});
