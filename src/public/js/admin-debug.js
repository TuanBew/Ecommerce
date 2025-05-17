/**
 * Admin Debug Utilities
 * Provides functions to help diagnose issues in the admin panel
 */

// Debug flag - set to true to enable debugging features
const DEBUG_MODE = true;

// Create a logger that only logs in debug mode
const debugLog = function() {
    if (DEBUG_MODE) {
        console.log('[DEBUG]', ...arguments);
    }
};

// Log form data for debugging
function logFormData(form) {
    if (!DEBUG_MODE) return;
    
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
        // Don't log file content, just the fact that it exists
        if (value instanceof File) {
            data[key] = `File: ${value.name} (${Math.round(value.size/1024)}KB)`;
        } else {
            // Truncate long text values
            if (typeof value === 'string' && value.length > 100) {
                data[key] = value.substring(0, 100) + '...';
            } else {
                data[key] = value;
            }
        }
    });
    
    console.log('Form Data:', data);
}

// Test API endpoints
async function testEndpoint(url, method = 'GET', data = null) {
    console.log(`Testing endpoint: ${method} ${url}`);
    try {
        const options = {
            method: method,
            headers: {}
        };
        
        if (data) {
            if (data instanceof FormData) {
                options.body = data;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }
        }
        
        const response = await fetch(url, options);
        console.log(`Endpoint response: ${response.status} ${response.statusText}`);
        
        try {
            const responseData = await response.json();
            console.log('Response data:', responseData);
            return {
                status: response.status,
                ok: response.ok,
                data: responseData
            };
        } catch (e) {
            const text = await response.text();
            console.log('Response text:', text);
            return {
                status: response.status,
                ok: response.ok,
                text: text
            };
        }
    } catch (error) {
        console.error('Error testing endpoint:', error);
        return {
            status: 0,
            ok: false,
            error: error.message
        };
    }
}

/**
 * Admin debugging utilities
 */
(function() {
    const DEBUG = true;
    const LOG_PREFIX = '[ADMIN-DEBUG]';
    
    // Debug log function
    function debugLog(...args) {
        if (!DEBUG) return;
        console.log(LOG_PREFIX, ...args);
    }
    
    // Form data inspection
    function inspectForm(formId) {
        if (!DEBUG) return;
        
        const form = document.getElementById(formId);
        if (!form) {
            debugLog('Form not found:', formId);
            return;
        }
        
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            if (value instanceof File) {
                data[key] = `File: ${value.name || 'no-name'} (${value.size} bytes)`;
            } else {
                data[key] = value;
            }
        });
        
        debugLog('Form data:', data);
        return data;
    }
    
    // Test file upload
    async function testFileUpload(file, url) {
        if (!DEBUG) return;
        
        debugLog('Testing file upload:', file.name, 'to URL:', url);
        
        const formData = new FormData();
        formData.append('test_file', file);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            debugLog('Upload response status:', response.status);
            
            const data = await response.json();
            debugLog('Upload response data:', data);
            
            return { status: response.status, data };
        } catch (error) {
            debugLog('Upload error:', error);
            return { error };
        }
    }
    
    // Add debug UI
    function addDebugUI() {
        if (!DEBUG) return;
        
        const btn = document.createElement('button');
        btn.textContent = '🐞';
        btn.title = 'Debug Tools';
        btn.style.position = 'fixed';
        btn.style.bottom = '10px';
        btn.style.right = '10px';
        btn.style.zIndex = '9999';
        btn.style.width = '40px';
        btn.style.height = '40px';
        btn.style.borderRadius = '50%';
        btn.style.backgroundColor = '#ff5722';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        
        btn.addEventListener('click', function() {
            const editForm = document.getElementById('edit-product-form');
            if (editForm) {
                inspectForm('edit-product-form');
            }
            
            debugLog('Debug button clicked');
            alert('Debug info logged to console');
        });
        
        document.body.appendChild(btn);
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        debugLog('Admin debug tools initialized');
        addDebugUI();
    });
    
    // Export to global scope
    window.AdminDebug = {
        log: debugLog,
        inspectForm,
        testFileUpload
    };
})();
