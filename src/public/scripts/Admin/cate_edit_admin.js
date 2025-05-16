document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('saveButton');
    const categoryNameInput = document.querySelector('input[name="categoryName"]');
    const categoryTypeSelect = document.getElementById('category-type-label');
    const categoryId = document.getElementById('categoryId').value;
    const imageUpload = document.getElementById('imageUpload');
    let selectedFile = null;

    // Handle image selection
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            selectedFile = e.target.files[0];
            if (selectedFile) {
                // Display preview of the selected image
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.alt = "Selected Image";
                    img.style.maxWidth = "200px";
                    
                    // Remove any existing preview and add the new one
                    const previewContainer = document.querySelector('.current-image') || document.createElement('div');
                    previewContainer.innerHTML = '';
                    previewContainer.classList.add('current-image');
                    
                    const title = document.createElement('h5');
                    title.innerText = 'Ảnh đã chọn';
                    
                    previewContainer.appendChild(title);
                    previewContainer.appendChild(img);
                    
                    if (!document.querySelector('.current-image')) {
                        const dzMessage = document.querySelector('.dz-message');
                        dzMessage.parentNode.insertBefore(previewContainer, dzMessage);
                    }
                };
                reader.readAsDataURL(selectedFile);
            }
        });
    }

    // Handle form submission
    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            const categoryName = categoryNameInput.value.trim();
            const categoryType = categoryTypeSelect.value;
            
            console.log('Submitting category update:', {
                categoryId,
                categoryName,
                categoryType
            });
            
            // Validate the form
            if (!categoryName) {
                alert('Vui lòng nhập tên danh mục');
                return;
            }

            // Create form data for submission
            const formData = new FormData();
            formData.append('categoryId', categoryId);
            formData.append('categoryName', categoryName);
            formData.append('categoryType', categoryType);
            
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            try {
                // Use API endpoint for consistency
                const response = await fetch(`/admin/api/update-category`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.status === 'success') {
                    alert('Cập nhật danh mục thành công');
                    window.location.href = '/admin/categories_admin';
                } else {
                    alert(result.message || 'Đã xảy ra lỗi khi cập nhật danh mục');
                }
            } catch (error) {
                console.error('Error updating category:', error);
                alert(`Đã xảy ra lỗi khi cập nhật danh mục: ${error.message}`);
            }
        });
    }

    // Drag and drop functionality for image upload
    const dropZone = document.querySelector('.dz-dropzone');
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        dropZone.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length) {
                imageUpload.files = files;
                const event = new Event('change', { bubbles: true });
                imageUpload.dispatchEvent(event);
            }
        }
    }
});
