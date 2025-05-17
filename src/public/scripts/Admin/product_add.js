document.addEventListener('DOMContentLoaded', function() {
    // Variables
    let variantCount = 1;
    let specCount = 1;
    let selectedFiles = []; // Store selected files
    
    // Get elements
    const productForm = document.getElementById('productForm');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const variantsContainer = document.getElementById('variants-container');
    const addVariantBtn = document.getElementById('add-variant-btn');
    const specsContainer = document.getElementById('specs-container');
    const addSpecBtn = document.getElementById('add-spec-btn');
    const productImagesInput = document.getElementById('product_images');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    
    // Initialize the form
    init();
    
    function init() {
        // Setup event listeners
        if (addVariantBtn) {
            addVariantBtn.addEventListener('click', addVariant);
        }
        
        if (addSpecBtn) {
            addSpecBtn.addEventListener('click', addSpec);
        }
        
        if (productImagesInput) {
            productImagesInput.addEventListener('change', handleImageSelection);
        }
        
        if (saveProductBtn) {
            saveProductBtn.addEventListener('click', saveProduct);
        }
        
        // Setup drag and drop for images
        setupDragAndDrop();
    }
    
    // Add a new product variant
    function addVariant() {
        const index = variantCount++;
        const variantTemplate = `
            <div class="variant-item" data-index="${index}">
                <div class="variant-header">
                    <h5>Biến thể #${variantCount}</h5>
                    <button type="button" class="btn-remove-variant">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
                <div class="variant-body">
                    <div class="form-group">
                        <label for="variant_name_${index}">Tên biến thể <span class="required">*</span></label>
                        <input type="text" class="form-control variant-name" id="variant_name_${index}" name="variants[${index}][name]" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="variant_price_${index}">Giá <span class="required">*</span></label>
                            <input type="number" class="form-control" id="variant_price_${index}" name="variants[${index}][price]" required min="0">
                        </div>
                        <div class="form-group">
                            <label for="variant_stock_${index}">Số lượng tồn <span class="required">*</span></label>
                            <input type="number" class="form-control" id="variant_stock_${index}" name="variants[${index}][stock]" required min="0" value="100">
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="variant_bestseller_${index}" name="variants[${index}][is_bestseller]">
                                <label for="variant_bestseller_${index}">Biến thể bán chạy</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        variantsContainer.insertAdjacentHTML('beforeend', variantTemplate);
        
        // Enable remove button for first variant if we have more than one
        if (variantCount > 1) {
            const firstVariantRemoveBtn = document.querySelector('.variant-item[data-index="0"] .btn-remove-variant');
            if (firstVariantRemoveBtn) {
                firstVariantRemoveBtn.style.display = 'flex';
            }
        }
        
        // Add event listener for the new remove button
        const removeBtn = document.querySelector(`.variant-item[data-index="${index}"] .btn-remove-variant`);
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                removeVariant(index);
            });
        }
    }
    
    // Remove a variant
    function removeVariant(index) {
        const variant = document.querySelector(`.variant-item[data-index="${index}"]`);
        if (variant) {
            variant.remove();
            
            // If only one variant remains, hide its remove button
            const remainingVariants = document.querySelectorAll('.variant-item');
            if (remainingVariants.length === 1) {
                const lastRemoveBtn = remainingVariants[0].querySelector('.btn-remove-variant');
                if (lastRemoveBtn) {
                    lastRemoveBtn.style.display = 'none';
                }
            }
            
            // Renumber the variant titles
            const variantTitles = document.querySelectorAll('.variant-item .variant-header h5');
            variantTitles.forEach((title, idx) => {
                title.textContent = `Biến thể #${idx + 1}`;
            });
            
            variantCount = remainingVariants.length;
        }
    }
    
    // Add a new specification
    function addSpec() {
        const index = specCount++;
        const specTemplate = `
            <div class="spec-item" data-index="${index}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="spec_name_${index}">Tên thông số</label>
                        <input type="text" class="form-control" id="spec_name_${index}" name="specs[${index}][name]" placeholder="Ví dụ: Bộ nhớ, RAM...">
                    </div>
                    <div class="form-group">
                        <label for="spec_value_${index}">Giá trị</label>
                        <input type="text" class="form-control" id="spec_value_${index}" name="specs[${index}][value]" placeholder="Ví dụ: 64GB, 8GB...">
                    </div>
                    <div class="form-group spec-action">
                        <button type="button" class="btn-remove-spec">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        specsContainer.insertAdjacentHTML('beforeend', specTemplate);
        
        // Enable remove button for first spec if we have more than one
        if (specCount > 1) {
            const firstSpecRemoveBtn = document.querySelector('.spec-item[data-index="0"] .btn-remove-spec');
            if (firstSpecRemoveBtn) {
                firstSpecRemoveBtn.style.display = 'flex';
            }
        }
        
        // Add event listener for the new remove button
        const removeBtn = document.querySelector(`.spec-item[data-index="${index}"] .btn-remove-spec`);
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                removeSpec(index);
            });
        }
    }
    
    // Remove a specification
    function removeSpec(index) {
        const spec = document.querySelector(`.spec-item[data-index="${index}"]`);
        if (spec) {
            spec.remove();
            
            // If only one spec remains, hide its remove button
            const remainingSpecs = document.querySelectorAll('.spec-item');
            if (remainingSpecs.length === 1) {
                const lastRemoveBtn = remainingSpecs[0].querySelector('.btn-remove-spec');
                if (lastRemoveBtn) {
                    lastRemoveBtn.style.display = 'none';
                }
            }
            
            specCount = remainingSpecs.length;
        }
    }
    
    // Handle image selection
    function handleImageSelection(event) {
        const files = event.target.files;
        
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Check if file is an image
                if (!file.type.startsWith('image/')) {
                    continue;
                }
                
                // Store the file
                selectedFiles.push(file);
                
                // Create image preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = createImagePreview(e.target.result, selectedFiles.length - 1);
                    imagePreviewContainer.appendChild(preview);
                };
                reader.readAsDataURL(file);
            }
            
            // Display the image preview container
            imagePreviewContainer.style.display = 'flex';
            
            // Hide the upload message if we have images
            const uploadMessage = document.querySelector('.dz-message');
            if (uploadMessage && selectedFiles.length > 0) {
                uploadMessage.style.display = 'none';
            }
        }
    }
    
    // Create an image preview element
    function createImagePreview(src, index) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = src;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image';
        removeBtn.innerHTML = '<span class="material-symbols-rounded">close</span>';
        removeBtn.addEventListener('click', function() {
            removeImage(index);
        });
        
        preview.appendChild(img);
        preview.appendChild(removeBtn);
        
        return preview;
    }
    
    // Remove an image
    function removeImage(index) {
        // Remove the file from the array
        selectedFiles.splice(index, 1);
        
        // Remove the preview
        const preview = document.querySelector(`.image-preview[data-index="${index}"]`);
        if (preview) {
            preview.remove();
        }
        
        // Reindex remaining previews
        const previews = document.querySelectorAll('.image-preview');
        previews.forEach((preview, idx) => {
            preview.dataset.index = idx;
            const removeBtn = preview.querySelector('.remove-image');
            if (removeBtn) {
                removeBtn.onclick = function() {
                    removeImage(idx);
                };
            }
        });
        
        // Show upload message if no images
        const uploadMessage = document.querySelector('.dz-message');
        if (uploadMessage && selectedFiles.length === 0) {
            uploadMessage.style.display = 'block';
            imagePreviewContainer.style.display = 'none';
        }
    }
    
    // Setup drag and drop for images
    function setupDragAndDrop() {
        const dropzone = document.querySelector('.dz-dropzone');
        if (!dropzone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropzone.classList.add('highlighted');
        }
        
        function unhighlight() {
            dropzone.classList.remove('highlighted');
        }
        
        dropzone.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            productImagesInput.files = files;
            const event = new Event('change', { bubbles: true });
            productImagesInput.dispatchEvent(event);
        }
    }
    
    // Save the product
    function saveProduct() {
        // Validate form before submission
        if (!validateForm()) {
            return;
        }
        
        // Create form data
        const formData = new FormData(productForm);
        
        // Add the selected files
        selectedFiles.forEach((file, index) => {
            formData.append(`product_images_${index}`, file);
        });
        
        // Add file count
        formData.append('file_count', selectedFiles.length);
        
        // Send the form data to server
        fetch('/admin/api/add-product', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                alert('Thêm sản phẩm thành công!');
                window.location.href = '/admin/products_admin';
            } else {
                alert(result.message || 'Có lỗi xảy ra khi thêm sản phẩm.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Đã xảy ra lỗi khi xử lý yêu cầu.');
        });
    }
    
    // Validate the form
    function validateForm() {
        // Check product name
        const productName = document.getElementById('product_name');
        if (!productName.value.trim()) {
            alert('Vui lòng nhập tên sản phẩm.');
            productName.focus();
            return false;
        }
        
        // Check category
        const categoryId = document.getElementById('category_id');
        if (!categoryId.value) {
            alert('Vui lòng chọn danh mục sản phẩm.');
            categoryId.focus();
            return false;
        }
        
        // Check if we have at least one image
        if (selectedFiles.length === 0) {
            alert('Vui lòng thêm ít nhất một hình ảnh cho sản phẩm.');
            return false;
        }
        
        // Check variants
        const variantNames = document.querySelectorAll('.variant-name');
        let isValid = true;
        
        variantNames.forEach((input, index) => {
            if (!input.value.trim()) {
                alert(`Vui lòng nhập tên cho biến thể #${index + 1}.`);
                input.focus();
                isValid = false;
                return;
            }
            
            const priceInput = document.getElementById(`variant_price_${input.closest('.variant-item').dataset.index}`);
            if (!priceInput.value || isNaN(priceInput.value) || Number(priceInput.value) <= 0) {
                alert(`Vui lòng nhập giá hợp lệ cho biến thể #${index + 1}.`);
                priceInput.focus();
                isValid = false;
                return;
            }
        });
        
        return isValid;
    }
});
