// import lib
const ejs = require('ejs');
const path = require('path')
const express = require('express')
const util = require('util')
const app = express()
const dotdenv = require('dotenv').config();
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload');
const fs = require('fs');

// connect to db
const db = require('./src/config/db/connect');
const query = util.promisify(db.query).bind(db)

const cfg = require('./src/config/index')
const route = require('./src/routes/index')

// set view engine
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// use static folder
app.use(express.static(path.join('src', 'public')))

//parse URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('secret'))

// Configure file upload middleware with enhanced settings
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    createParentPath: true, // Creates the directory path if it does not exist
    debug: true, // Log detailed debug information
    abortOnLimit: true, // Return 413 when limit is reached
    useTempFiles: true, // Use temp files for large uploads
    tempFileDir: path.join(__dirname, 'tmp'), // Temp directory
    safeFileNames: true, // Remove special characters from file names
    preserveExtension: true, // Keep file extensions
    uploadTimeout: 0 // No timeout for uploads
}));

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('Created temp directory for file uploads');
}

// Add a debug middleware for all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

//app.use('/', require('./routes/index'))

// route init
route(app)

app.listen(cfg.port, () => {
    console.log(`Website is running at http://${cfg.host}:${cfg.port}`)
})