document.addEventListener("DOMContentLoaded", function () {
    let activeNav = localStorage.getItem("activeNav");
  
    if (activeNav) {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.nav === activeNav) {
                item.classList.add('active');
            }
        });
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Store the active navigation item in localStorage
            localStorage.setItem("activeNav", this.dataset.nav);
        });
    });
});

function changePage(page) {
    if (page < 1 || page > Math.ceil(allItems.length / itemsPerPage)) return;
    currentPage = page;
    displayItems(allItems); // Re-render items for the new page
    updatePaginationButtons(allItems.length); // Re-render pagination buttons
}

document.getElementById('selectAllCheckbox').addEventListener('change', function (event) {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = event.target.checked; // Check/uncheck all checkboxes
        checkbox.dispatchEvent(new Event('change')); // Trigger change event to update selectedItems
    });
});

let selectedItems = []; // Array to store selected item IDs

function handleCheckboxChange(event) {
    const checkbox = event.target;
    const itemId = checkbox.getAttribute('data-id');

    if (checkbox.checked) {
        // Add item ID to selectedItems array if checked
        selectedItems.push(itemId);
    } else {
        // Remove item ID from selectedItems array if unchecked
        selectedItems = selectedItems.filter(id => id !== itemId);
    }

    console.log('Selected Items:', selectedItems); // Log selected items for debugging
}

// Attach event listeners to checkboxes after rendering the table
function attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
}
