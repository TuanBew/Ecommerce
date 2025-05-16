// This script handles the dropdown menu functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get all dropdown toggle buttons
    const dropdownToggleButtons = document.querySelectorAll('.action__dropdown > li > span.dropdown-toggle');
    // Add click event to each dropdown toggle button
    dropdownToggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            
            // Find the dropdown list associated with this button
            const dropdownList = this.nextElementSibling;
            
            // Close all other dropdown lists first
            document.querySelectorAll('.dropdown__list.show').forEach(list => {
                if (list !== dropdownList) {
                    list.classList.remove('show');
                }
            });
            
            // Toggle the dropdown list
            dropdownList.classList.toggle('show');
        });
    });
    
    // Close dropdown when clicking elsewhere on the page
    document.addEventListener('click', function(e) {
        document.querySelectorAll('.dropdown__list.show').forEach(list => {
            list.classList.remove('show');
        });
    });
    
    // Prevent dropdown from closing when clicking inside it
    document.querySelectorAll('.dropdown__list').forEach(list => {
        list.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
        });
    });
});
