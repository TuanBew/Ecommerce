document.addEventListener('DOMContentLoaded', function() {
    // Find all delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete');
    
    // Add click event handler to each delete button
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            const categoryRow = this.closest('tr');
            const categoryName = categoryRow.querySelector('td:nth-child(3)').textContent;
            
            // Show confirmation dialog
            if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}" không?\n\nCác sản phẩm thuộc danh mục này sẽ không còn thuộc danh mục nào.`)) {
                // Send delete request
                fetch(`/admin/api/delete-category/${categoryId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(result => {
                    if (result.status === 'success') {
                        // Remove row from table
                        categoryRow.remove();
                        alert('Đã xóa danh mục thành công!');
                    } else {
                        alert(result.message || 'Không thể xóa danh mục này.');
                    }
                })
                .catch(error => {
                    console.error('Error deleting category:', error);
                    alert('Đã xảy ra lỗi khi xóa danh mục.');
                });
            }
        });
    });

    // Make the search functionality work
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#categories-table tbody tr');
            
            rows.forEach(row => {
                const categoryName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                if (categoryName.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});
