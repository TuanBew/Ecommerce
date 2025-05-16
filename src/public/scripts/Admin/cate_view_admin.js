// add another variant or detail
const addAnotherBtn = Array.from(document.querySelectorAll('.add-another-btn'))

addAnotherBtn.forEach(btn => {
    btn.addEventListener('click', addAnother)
})

function addAnother(event) {
    const current = event.currentTarget
    const lastItem = Array.from(current.previousElementSibling.children).slice(-1)[0]
    const newLastItem = lastItem.cloneNode(true)

    lastItem.after(newLastItem)
}

// Handle category form submission
document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.querySelector('.btn-admin.btn-primary');
    const categoryNameInput = document.querySelector('input[name="productName"]');
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
    }

    // Handle form submission
    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            const categoryName = categoryNameInput.value.trim();
            
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
            formData.append('image', selectedFile);

            try {
                // Send request to add the category
                const response = await fetch('/admin/categories_admin/add', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.status === 'success') {
                    alert(result.message);
                    window.location.href = '/admin/categories_admin';
                } else {
                    alert(result.message || 'Đã xảy ra lỗi khi thêm danh mục');
                }
            } catch (error) {
                console.error('Error adding category:', error);
                alert('Đã xảy ra lỗi khi thêm danh mục');
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
    }
});