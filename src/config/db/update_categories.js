const db = require('./connect');
const util = require('util');
const fs = require('fs');
const path = require('path');

// Convert db.query to promise-based
const query = util.promisify(db.query).bind(db);

async function createBackup() {
    try {
        console.log('Creating backup of categories table...');
        const backupSqlPath = path.join(__dirname, 'category_backup.sql');
        const backupSql = fs.readFileSync(backupSqlPath, 'utf8');
        
        await query(backupSql);
        console.log('Backup created successfully!');
        return true;
    } catch (error) {
        console.error('Error creating backup:', error);
        return false;
    }
}

async function updateCategories() {
    try {
        // First create a backup
        const backupSuccess = await createBackup();
        if (!backupSuccess) {
            console.error('Failed to create backup. Aborting updates.');
            process.exit(1);
        }
        
        // Get current categories for verification afterward
        const beforeCategories = await query('SELECT * FROM categories');
        console.log('Categories before update:', beforeCategories);
        
        // Read SQL file
        const sqlFilePath = path.join(__dirname, 'category_update.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Split SQL statements
        const statements = sqlScript.split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);
        
        // Execute each statement
        for (const statement of statements) {
            await query(statement);
            console.log('Executed:', statement);
        }
        
        // Verify relationships are preserved
        console.log('Verifying product relationships...');
        const products = await query('SELECT * FROM products');
        const updatedCategories = await query('SELECT * FROM categories');
        
        // Log results
        console.log('Categories after update:', updatedCategories);
        console.log(`Products count: ${products.length}`);
        
        // Check for any products with invalid category IDs
        const categoryIds = updatedCategories.map(cat => cat.category_id);
        const orphanedProducts = products.filter(product => !categoryIds.includes(product.category_id));
        
        if (orphanedProducts.length > 0) {
            console.warn('Warning: Some products have invalid category IDs:', orphanedProducts);
        } else {
            console.log('All products have valid category references.');
        }
        
        console.log('Categories updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating categories:', error);
        // Try to restore from backup if update fails
        try {
            await query('DROP TABLE IF EXISTS categories');
            await query('CREATE TABLE categories AS SELECT * FROM categories_backup');
            console.log('Restored categories from backup due to error');
        } catch (restoreError) {
            console.error('Failed to restore backup:', restoreError);
        }
        process.exit(1);
    }
}

// Create a function to restore from backup if needed
async function restoreFromBackup() {
    try {
        console.log('Restoring from backup...');
        await query('DROP TABLE IF EXISTS categories');
        await query('CREATE TABLE categories AS SELECT * FROM categories_backup');
        console.log('Restored successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error restoring backup:', error);
        process.exit(1);
    }
}

// Check for restore command line argument
if (process.argv.includes('--restore')) {
    restoreFromBackup();
} else {
    updateCategories();
}
