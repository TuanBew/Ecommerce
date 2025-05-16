document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('saveButton');
    const categoryNameInput = document.querySelector('input[name="categoryName"]');
    const categoryTypeSelect = document.getElementById('category-type-label');
    const imageUpload = document.getElementById('imageUpload');
    let selectedFile = null;

    // Handle image selection
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
                
                // Create and display preview
                const previewContainer = document.createElement('div');
                previewContainer.classList.add('preview-image');
                
                const title = document.createElement('h5');
                title.innerText = 'Ảnh đã chọn';
                
                previewContainer.appendChild(title);
                previewContainer.appendChild(img);
                
                // Remove any existing preview and add the new one
                const existingPreview = document.querySelector('.preview-image');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                const dzMessage = document.querySelector('.dz-message');
                dzMessage.parentNode.insertBefore(previewContainer, dzMessage);
            };
            reader.readAsDataURL(selectedFile);
        }
    });

    // Handle form submission
    saveButton.addEventListener('click', async function() {
        const categoryName = categoryNameInput.value.trim();
        const categoryType = categoryTypeSelect.value;
        
        console.log('Submitting category:', {
            categoryName,
            categoryType
        });
        
        // Validate the form
        if (!categoryName) {
            alert('Vui lòng nhập tên danh mục');
            return;
        }
        
        if (!selectedFile) {
            alert('Vui lòng chọn ảnh cho danh mục');
            return;
        }

        // Create form data for submission
        const formData = new FormData();
        formData.append('categoryName', categoryName);
        formData.append('categoryType', categoryType);
        formData.append('image', selectedFile);

        try {
            // Send request to add the category
            const response = await fetch('/admin/api/add-category', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
                alert('Thêm danh mục thành công');
                window.location.href = '/admin/categories_admin';
            } else {
                alert(result.message || 'Đã xảy ra lỗi khi thêm danh mục');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            alert(`Đã xảy ra lỗi khi thêm danh mục: ${error.message}`);
        }
    });

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
