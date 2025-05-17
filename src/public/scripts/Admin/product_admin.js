document.addEventListener('DOMContentLoaded', function() {
    // Select All checkbox functionality
    const selectAllCheckbox = document.getElementById('selectAll');
    const productCheckboxes = document.querySelectorAll('.productCheckbox');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            productCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            updateBulkActionButtons();
        });
    }
    
    // Individual checkbox change handler
    productCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateBulkActionButtons();
            
            // Update "Select All" checkbox state
            if (!this.checked) {
                selectAllCheckbox.checked = false;
            } else {
                // Check if all checkboxes are checked
                const allChecked = Array.from(productCheckboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
            }
        });
    });
    
    // Delete button functionality
    const deleteButtons = document.querySelectorAll('.btn-delete');
    const deleteModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    let productToDelete = null;
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            productToDelete = this.getAttribute('data-id');
            deleteModal.style.display = 'flex';
        });
    });
    
    // Cancel delete
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteModal.style.display = 'none';
            productToDelete = null;
        });
    }
    
    // Confirm delete
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (productToDelete) {
                deleteProduct(productToDelete);
            }
        });
    }
    
    // Delete product function
    function deleteProduct(productId) {
        fetch(`/admin/api/delete-product/${productId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                // Remove row from table
                const productRow = document.querySelector(`.productItem[data-id="${productId}"]`);
                if (productRow) {
                    productRow.remove();
                }
                deleteModal.style.display = 'none';
                alert('Sản phẩm đã được xóa thành công');
            } else {
                alert(result.message || 'Không thể xóa sản phẩm này');
            }
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            alert('Đã xảy ra lỗi khi xóa sản phẩm');
        });
    }
    
    // Bulk actions
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const showSelectedBtn = document.getElementById('showSelectedBtn');
    const hideSelectedBtn = document.getElementById('hideSelectedBtn');
    
    // Update bulk action buttons state
    function updateBulkActionButtons() {
        const hasChecked = Array.from(productCheckboxes).some(cb => cb.checked);
        
        [deleteSelectedBtn, showSelectedBtn, hideSelectedBtn].forEach(btn => {
            if (btn) {
                btn.disabled = !hasChecked;
                btn.classList.toggle('disabled', !hasChecked);
            }
        });
    }
    
    // Initialize button states
    updateBulkActionButtons();
    
    // Bulk delete handler
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', function() {
            const selectedProducts = [];
            productCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const productRow = checkbox.closest('.productItem');
                    selectedProducts.push(productRow.getAttribute('data-id'));
                }
            });
            
            if (selectedProducts.length > 0) {
                if (confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn không?`)) {
                    // Implement bulk delete API call
                    fetch('/admin/api/bulk-delete-products', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ productIds: selectedProducts })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.status === 'success') {
                            // Remove deleted rows
                            selectedProducts.forEach(id => {
                                const productRow = document.querySelector(`.productItem[data-id="${id}"]`);
                                if (productRow) {
                                    productRow.remove();
                                }
                            });
                            alert('Các sản phẩm đã được xóa thành công');
                        } else {
                            alert(result.message || 'Không thể xóa các sản phẩm đã chọn');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting products:', error);
                        alert('Đã xảy ra lỗi khi xóa sản phẩm');
                    });
                }
            }
        });
    }
    
    // Show/Hide selected products
    function updateProductsVisibility(visibility) {
        const selectedProducts = [];
        productCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const productRow = checkbox.closest('.productItem');
                selectedProducts.push(productRow.getAttribute('data-id'));
            }
        });
        
        if (selectedProducts.length > 0) {
            fetch('/admin/api/update-products-visibility', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    productIds: selectedProducts,
                    visibility: visibility 
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    // Update UI to reflect visibility changes
                    window.location.reload();
                } else {
                    alert(result.message || 'Không thể cập nhật trạng thái sản phẩm');
                }
            })
            .catch(error => {
                console.error('Error updating product visibility:', error);
                alert('Đã xảy ra lỗi khi cập nhật trạng thái sản phẩm');
            });
        }
    }
    
    if (showSelectedBtn) {
        showSelectedBtn.addEventListener('click', function() {
            updateProductsVisibility(1);
        });
    }
    
    if (hideSelectedBtn) {
        hideSelectedBtn.addEventListener('click', function() {
            updateProductsVisibility(0);
        });
    }
});
