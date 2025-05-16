document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('saveButton');
    const categoryNameInput = document.querySelector('input[name="categoryName"]');
    const categoryId = document.getElementById('categoryId').value;
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

    // Handle form submission
    saveButton.addEventListener('click', async function() {
        const categoryName = categoryNameInput.value.trim();
        
        // Validate the form
        if (!categoryName) {
            alert('Vui lòng nhập tên danh mục');
            return;
        }

        // Create form data for submission
        const formData = new FormData();
        formData.append('categoryName', categoryName);
        
        if (selectedFile) {
            formData.append('image', selectedFile);
        } else {
            // Check if there's no image selected and there's also no existing image
            const currentImage = document.querySelector('.current-image img');
            if (!currentImage) {
                alert('Vui lòng chọn ảnh cho danh mục');
                return;
            }
        }

        try {
            // Send request to update the category
            const response = await fetch(`/admin/categories_admin/edit/${categoryId}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                alert(result.message);
                window.location.href = '/admin/categories_admin';
            } else {
                alert(result.message || 'Đã xảy ra lỗi khi cập nhật danh mục');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            alert('Đã xảy ra lỗi khi cập nhật danh mục');
        }
    });

    // Drag and drop functionality for image upload
    const dropZone = document.querySelector('.dz-dropzone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('dz-highlight');
    }

    function unhighlight() {
        dropZone.classList.remove('dz-highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            selectedFile = files[0];
            imageUpload.files = files;
            
            // Trigger the change event to display the preview
            const event = new Event('change');
            imageUpload.dispatchEvent(event);
        }
    }
});
