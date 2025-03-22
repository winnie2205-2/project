let currentPage = 1; // Track the current page
const itemsPerPage = 10; // Number of items to display per page
let allItems = []; // Store all items fetched from the API
let filteredItems = []; // Store filtered items for search
let selectedItems = []; // Store selected item IDs

// Add this near the top of your JavaScript file
const tableStyleProtection = document.createElement('style');
tableStyleProtection.innerHTML = `
    /* Protect main table styles from popup CSS */
    #itemTableBody tr {
        background-color: inherit;
    }
    
    #itemTableBody tr.disabled-row,
    #itemTableBody tr.disabled-row td {
        background-color: #C7C8CC !important;
        color: #222831 !important;
    }
    
    #itemTableBody tr.table-danger {
        background-color: var(--bs-table-danger-bg) !important;
    }
    
    #itemTableBody tr.table-warning {
        background-color: var(--bs-table-warning-bg) !important;
    }
    
    #itemTableBody tr.table-success {
        background-color: var(--bs-table-success-bg) !important;
    }
`;
document.head.appendChild(tableStyleProtection);

// Fetch items from the API
async function fetchItems() {
    console.log('Fetching items...');
    try {
        const response = await fetch('http://localhost:5000/api/items');
        if (!response.ok) {
            throw new Error('Failed to fetch items');
        }
        const items = await response.json();
        
        // Sort items to show newest first based on createdAt/updatedAt timestamp
        items.sort((a, b) => {
            // First try to sort by updatedAt (most recently modified)
            if (a.updatedAt && b.updatedAt) {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
            // Then try to sort by createdAt (most recently created)
            else if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            // Fallback to ID-based sorting
            return b._id.localeCompare(a._id);
        });
        
        allItems = items; // Store all items
        filteredItems = items; // Initialize filteredItems with all items

        // Reset to first page when fetching items
        currentPage = 1;
        
        // Reset the "Select All" checkbox
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
        // Clear selected items
        selectedItems = [];
        toggleActionButtons(); // Hide action buttons
        
        displayItems(filteredItems); // Display items on the current page
        updatePaginationButtons(filteredItems.length); // Update pagination buttons
    } catch (err) {
        console.error('Error fetching items:', err);
        alert('Failed to load items. Please check console for details.');
    }
}
// Display items in the table
// Display items in the table
function displayItems(items) {
    
    const tableBody = document.getElementById('itemTableBody');
    if (!tableBody) throw new Error('Table body element not found');

    tableBody.innerHTML = ''; // Clear old data

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = items.slice(startIndex, endIndex);

    if (itemsToDisplay.length === 0) {
        // If no items to display, show a message
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" class="text-center">ไม่มีข้อมูล</td>
        `;
        tableBody.appendChild(row);
    } else {
        // Display items
        itemsToDisplay.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // First determine the appropriate class based on status
            let rowClass;
            if (item.status === 'Disable') {
                row.classList.add('disabled-row');
                row.style.backgroundColor = '#3C3D37';
                row.style.color = '#ffffff';
            } else {
                const rowClass = getRowClass(item.alertLevel);
                row.classList.add(rowClass);
            } // This replaces all existing classes with our single class
            
            
            // Format the price with commas and 2 decimal places
            const formattedPrice = parseFloat(item.price).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            
            row.innerHTML = `
                <td class="text-center">
                    <input type="checkbox" class="item-checkbox" data-id="${item._id}" ${item.status === 'Disable' ? 'disabled' : ''}>
                </td>  
                <td class="text-center">${startIndex + index + 1}</td>  
                <td class="text-center">${item.categoryName}</td> 
                <td class="text-center">${item.name}</td>  
                <td class="text-center">${item.location}</td>  
                <td class="text-center">${item.qty.toLocaleString()}</td>  
                <td class="text-center">${formattedPrice}</td>  
                <td class="text-center">${item.status}</td>  
                <td class="text-center" style="white-space: nowrap;">
                    <div class="d-flex justify-content-center gap-1">
                        <button class="btn text-primary border-0 bg-transparent p-1 fs-5 edit-btn" data-id="${item._id}">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn text-danger border-0 bg-transparent p-1 fs-5 delete-btn" data-id="${item._id}">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    attachCheckboxListeners();
    attachEditAndDeleteListeners();
}

// Get row class based on alert level
function getRowClass(alertLevel) {
    switch (alertLevel) {
        case 'danger': return 'table-danger';  // สีแดง (ต้องเติมสินค้า)
        case 'warning': return 'table-warning'; // สีเหลือง (ใกล้ถึงจุดต้องเติมสินค้า)
        case 'gray': return 'disabled-row'; // สีเทา (ไอเทมถูกปิดใช้งาน)
        default: return 'table-white'; 
    }
}

const style = document.createElement('style');
style.innerHTML = `
    .disabled-row {
        background-color: #f0f0f0 !important;
        color: #a0a0a0 !important;
    }
`;

document.head.appendChild(style);
// Handle checkbox changes
function handleCheckboxChange(event) {
    const checkbox = event.target;
    const itemId = checkbox.getAttribute('data-id');

    if (checkbox.checked) {
        selectedItems.push(itemId);
    } else {
        selectedItems = selectedItems.filter(id => id !== itemId);
    }

    console.log('Selected Items:', selectedItems);
    toggleActionButtons();
}
// Attach event listeners to checkboxes
function attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
}

// Attach event listeners to edit and delete buttons
function attachEditAndDeleteListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => showEditBox(button.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => deleteItem(button.dataset.id));
    });
}

// Select/Deselect all checkboxes (skip disabled items)
document.getElementById('selectAllCheckbox').addEventListener('change', function (event) {
    const checkboxes = document.querySelectorAll('.item-checkbox:not(:disabled)'); // Skip disabled checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.checked = event.target.checked;
        checkbox.dispatchEvent(new Event('change'));
    });
});

// Show/hide action buttons based on selection
function toggleActionButtons() {
    const withdrawButton = document.getElementById('withdrawButton');
    const deleteButton = document.getElementById('deleteButton');

    if (selectedItems.length > 0) {
        withdrawButton.style.display = 'inline-block';
        deleteButton.style.display = 'inline-block';
    } else {
        withdrawButton.style.display = 'none';
        deleteButton.style.display = 'none';
    }
}

// Withdraw selected items
document.getElementById('withdrawButton').addEventListener('click', function () {
    if (selectedItems.length === 0) {
        alert('Please select at least one item to withdraw.');
        return;
    }

    // Open the withdrawal popup
    Swal.fire({
        html: `
        <div id="popupContainer">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.min.css"> 
            <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">
            <link rel="stylesheet" href="assets/css/style.css">
            <link rel="stylesheet" href="assets/css/popup.css">
            <link rel="stylesheet" href="assets/css/withdrawtable.css">
            <div class="container justify-content-left">
                <div class="d-flex justify-content-center">
                    <div class="card" style="background:#ebe3ce;width:800px;max-width:inherit;">
                        <div class="card-header text-center">
                            <h5 style="font-weight:bold;">Withdrawn</h5>
                        </div>
                        <div class="card-body">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>QTY</th>
                                    </tr>
                                </thead>
                                  <tbody>
                ${selectedItems.map(id => {
                    const item = allItems.find(item => item._id === id);
                    return `
                    <tr>
                        <td>${item.categoryName}</td>
                        <td>${item.name}</td>
                        <td>${item.location}</td>
                        <td>
                            <div class="input-group justify-content-center" style="width: 150px; margin: 0 auto;">
                                <button class="btn btn-outline-secondary decrease-qty" type="button" data-id="${item._id}">-</button>
                                <input class="form-control text-center withdraw-quantity" 
                                    id="withdraw-quantity" 
                                    type="text" 
                                    data-id="${item._id}" 
                                    data-max="${item.qty}"
                                    value="1" 
                                    style="width: 35px !important;"
                                    min="1" 
                                    max="${item.qty}">
                                <button class="btn btn-outline-secondary increase-qty" type="button" data-id="${item._id}">+</button>
                            </div>
                            <small class="form-text text-muted">Max: ${item.qty}</small>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
                            </table>
                            <div class="d-flex justify-content-end mt-3">
                                <button id="closeButton" class="btn btn-secondary me-2" type="button" style="background: #ebe3ce;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;padding: 7px 12px;border-radius: 50px;">Close</button>
                                <button id="saveButton" class="btn btn-success" type="button" style="background: #28aa4a;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;border-radius: 50px;padding-top: 7px;padding-bottom: 7px;">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `,
        showConfirmButton: false,
        showCancelButton: false,
        width: "900px",
        background: 'transparent',
        didOpen: () => {
            // Event listeners for quantity buttons
            document.querySelectorAll('.decrease-qty').forEach(button => {
                button.addEventListener('click', function () {
                    const input = document.querySelector(`.withdraw-quantity[data-id='${this.dataset.id}']`);
                    const currentValue = parseInt(input.value) || 0;
                    const min = 1;
                    input.value = Math.max(min, currentValue - 1);
                });
            });

            document.querySelectorAll('.withdraw-quantity').forEach(input => {
                input.addEventListener('input', function (event) {
                    const max = parseInt(this.dataset.max) || 1;
                    const min = 1;
                    
                    // Remove any non-numeric characters
                    let value = this.value.replace(/[^0-9]/g, '');
                    
                    // Convert to number and enforce limits
                    value = parseInt(value) || min;
                    value = Math.max(min, Math.min(max, value));
                    
                    this.value = value === min ? '' : value;
                });

                input.addEventListener('blur', function (event) {
                    const max = parseInt(this.dataset.max) || 1;
                    const min = 1;
                    let value = parseInt(this.value) || min;
                    value = Math.max(min, Math.min(max, value));
                    this.value = value;
                });
            });

            document.querySelectorAll('.increase-qty').forEach(button => {
                button.addEventListener('click', function () {
                    const input = document.querySelector(`.withdraw-quantity[data-id='${this.dataset.id}']`);
                    const currentValue = parseInt(input.value) || 0;
                    const max = parseInt(input.dataset.max) || 1;
                    input.value = Math.min(max, currentValue + 1);
                });
            });
        
            // Save button functionality
            document.getElementById('saveButton').addEventListener('click', async function () {
                const quantities = [];
                let isValid = true;
            
                document.querySelectorAll('.withdraw-quantity').forEach(input => {
                    const itemId = input.getAttribute('data-id');
                    const max = parseInt(input.dataset.max) || 0;
                    const qty = parseInt(input.value) || 0;
            
                    if (qty < 1 || qty > max) {
                        isValid = false;
                        input.classList.add('is-invalid');
                    } else {
                        quantities.push({
                            itemId: itemId,
                            qty: qty
                        });
                    }
                });
            
                if (!isValid) {
                    Swal.fire('Error', 'Some quantities are invalid. Please check values.', 'error');
                    return;
                }
            

                console.log('Withdrawing items:', quantities);

                try {
                    const response = await fetch('/api/items/withdraw', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            itemId: quantities[0]?.itemId,  // Assuming single item withdrawal
                            qty: quantities[0]?.qty,
                            user: "john_doe" // Replace with actual user
                        }),
                    });

                    if (response.ok) {
                        // Update the frontend state
                        const updatedItem = allItems.find(item => item._id === quantities[0].itemId);
                        if (updatedItem) {
                            updatedItem.qty -= quantities[0].qty; // Reduce the quantity
                        }

                        // Re-render the table
                        displayItems(filteredItems);

                        // Deselect the "Select All" checkbox
                        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
                        if (selectAllCheckbox) {
                            selectAllCheckbox.checked = false;
                        }

                        // Clear selected items
                        selectedItems = [];
                        toggleActionButtons(); // Hide action buttons

                        Swal.fire('Success', 'Items have been withdrawn.', 'success').then(() => {
                            Swal.close();
                        });
                    } else {
                        Swal.fire('Error', 'Failed to withdraw items.', 'error');
                    }
                } catch (error) {
                    console.error('Error during withdrawal:', error);
                    Swal.fire('Error', 'An error occurred during the withdrawal.', 'error');
                }
            });

            // Close button with confirmation
            document.getElementById('closeButton').addEventListener('click', function () {
                Swal.fire({
                    title: 'Are you sure?',
                    text: 'The withdrawal has not been saved. Do you want to cancel?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, cancel',
                    cancelButtonText: 'No, keep editing'
                }).then((result) => {
                    if (result.isConfirmed) {
                        Swal.close();
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        // Reopen the popup if "No, keep editing" is clicked
                        document.getElementById('withdrawButton').click();
                    }
                });
            });
        }
    });
});

// Delete selected items
// Delete selected items
document.getElementById('deleteButton').addEventListener('click', function () {
    if (selectedItems.length === 0) {
        alert('Please select at least one item to delete.');
        return;
    }

    Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to delete selected items. This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete!',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const deletePromises = selectedItems.map(id => fetch(`http://localhost:5000/api/items/${id}`, {
                    method: 'DELETE'
                }));

                const responses = await Promise.all(deletePromises);
                const allSuccessful = responses.every(response => response.ok);

                if (allSuccessful) {
                    // Reset the "Select All" checkbox
                    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
                    if (selectAllCheckbox) {
                        selectAllCheckbox.checked = false;
                    }
                    
                    // Clear selected items
                    selectedItems = [];
                    toggleActionButtons(); // Hide action buttons
                    
                    Swal.fire('Deleted!', 'Selected items have been deleted.', 'success').then(() => {
                        fetchItems(); // Refresh the table
                    });
                } else {
                    Swal.fire('Error', 'Failed to delete some items.', 'error');
                }
            } catch (error) {
                console.error('Error deleting items:', error);
                Swal.fire('Error', 'An error occurred while deleting items.', 'error');
            }
        }
    });
});

// Handle search input
document.getElementById('searchInput').addEventListener('input', function (event) {
    const searchQuery = event.target.value.trim().toLowerCase();

    // Filter items based on the search query
    filteredItems = allItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery) || // Search by item name
        item.categoryName.toLowerCase().includes(searchQuery) || // Search by category name
        (item.categoryID && item.categoryID.toLowerCase().includes(searchQuery)) || // Search by category ID (if exists)
        item.location.toLowerCase().includes(searchQuery) // Search by location
    );

    // Reset to the first page after search
    currentPage = 1;

    // Display filtered items
    displayItems(filteredItems);
    updatePaginationButtons(filteredItems.length);
});

// Update pagination buttons
function updatePaginationButtons(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.querySelector(".pagination");
    if (!pagination) {
        console.error("❌ Pagination element not found!");
        return;
    }

    pagination.innerHTML = ""; // Clear existing pagination buttons

    // Previous button
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;" tabindex="-1">«</a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }

    // Next button
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;" tabindex="-1">»</a>
        </li>
    `;
}

// Change page
function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredItems.length / itemsPerPage)) return;
    currentPage = page;

    // Clear all checkboxes
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Deselect the "Select All" checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }

    // Clear selected items
    selectedItems = [];
    toggleActionButtons(); // Hide action buttons

    // Re-render items for the new page
    displayItems(filteredItems);
    updatePaginationButtons(filteredItems.length);
}

// Call fetchItems on page load
window.onload = function () {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in first.");
        window.location.href = '/index.html';
        return;
    }

    fetchItems();
};

async function showEditBox(_id) {
    try {
        console.log("Fetching item with ID:", _id);
        const response = await fetch(`http://localhost:5000/api/items/` + _id);
        if (!response.ok) {
            throw new Error('Failed to fetch item details');
        }
        const item = await response.json();

        // Format the price with commas
        const formattedPrice = parseFloat(item.price).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        Swal.fire({
            html: `
             <div id="popupContainer">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.min.css"> 
            <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">
            <link rel="stylesheet" href="assets/css/style.css">
            <link rel="stylesheet" href="assets/css/popup.css">
            <div class="container justify-content-center mt-5">
                <div class="d-flex justify-content-center">
                    <div class="card" style="background: #ebe3ce;width: 500px;max-width: inherit;">
                        <div class="card-header text-center" style="background: #ebe3ce;">
                            <h5 style="font-weight: bold;">Edit Product Information</h5>
                        </div>
                        <div class="card-body">
                            <form id="editProductForm">
                                <div class="mb-3">
                                    <label class="form-label" for="productID">ID*</label>
                                    <input class="form-control" type="text" id="productID" placeholder="Product ID" value="${item.category}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label" for="productName">Name*</label>
                                    <input class="form-control" type="text" id="productName" placeholder="Name of the product" value="${item.name}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label" for="productLocation">Location*</label>
                                    <select class="form-select" id="productLocation" style="box-shadow:0px 0px 5px 2px;">
                                        <option value="" selected>Choose Location</option>
                                        <option value="Nakhon Si Thammarat" ${item.location === 'Nakhon Si Thammarat' ? 'selected' : ''}>Nakhon Si Thammarat</option>
                                        <option value="Krabi" ${item.location === 'Krabi' ? 'selected' : ''}>Krabi</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label" for="productQuantity">Quantity*</label>
                                    <input class="form-control" type="number" id="productQuantity" min="0" placeholder="Quantity" value="${item.qty}">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label" for="productPrice">Prices (THB) / Product*</label>
                                    <input class="form-control" type="text" id="productPrice" placeholder="Price (THB)" value="${formattedPrice}">
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-3 reorder-status-box">
                                    <div class="reorder-box">
                                        <label class="form-label" for="reorderPoint">Reorder Point*</label>
                                        <div class="input-group">
                                            <button class="btn btn-outline-secondary decrease-reorder" type="button" id="decreaseReorder">-</button>
                                            <input class="form-control text-center" type="text" id="reorderPoint" value="${item.reorderPoint || 0}">
                                            <button class="btn btn-outline-secondary increase-reorder" type="button" id="increaseReorder">+</button>
                                        </div>
                                    </div>
                                    <div class="status-box">
                                        <label class="form-label">Status*</label>
                                        <div class="d-flex justify-content-start align-items-center" style="background:#ffffff;height:40px;width:auto;min-width:200px;border-radius:5px;border:1px solid rgb(0,0,0);box-shadow:0px 0px 2px 1px;">
                                            <div class="form-check form-check-inline" style="margin-left:10px;">
                                                <input type="radio" class="form-check-input" id="statusEnable" name="statusOptions" style="border:2px solid rgb(0,0,0);" value="Enable" ${item.status === 'Enable' ? 'checked' : ''}>
                                                <label class="form-check-label" for="statusEnable">Enable</label>
                                            </div>
                                            <div class="form-check form-check-inline" style="margin-right:0px;">
                                                <input type="radio" class="form-check-input" id="statusDisable" name="statusOptions" style="border:2px solid rgb(0,0,0);" value="Disable" ${item.status === 'Disable' ? 'checked' : ''}>
                                                <label class="form-check-label" for="statusDisable">Disable</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-end mt-4">
                                    <button class="btn btn-secondary me-2" type="button" style="background: #ebe3ce;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;padding: 7px 12px;border-radius: 50px;" id="closeBtn">Close</button>
                                    <button class="btn btn-success" type="button" style="background: #28aa4a;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;border-radius: 50px;padding-top: 7px;padding-bottom: 7px;" id="saveBtn">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            `,
            showConfirmButton: false,
            showCancelButton: false,
            padding: "auto",
            width: "600px",
            background: 'transparent',
            didOpen: () => {
                const popup = Swal.getPopup();

                // Real-time price formatting
                popup.querySelector("#productPrice").addEventListener("input", function (event) {
                    // Remove non-numeric characters (except decimal point)
                    let value = event.target.value.replace(/[^0-9.]/g, '');

                    // Ensure only one decimal point
                    const decimalParts = value.split('.');
                    if (decimalParts.length > 2) {
                        value = decimalParts[0] + '.' + decimalParts.slice(1).join('');
                    }

                    // Format the value with commas
                    const numericValue = parseFloat(value.replace(/,/g, ''));
                    if (!isNaN(numericValue)) {
                        event.target.value = numericValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        });
                    } else {
                        event.target.value = '';
                    }
                });

                // Save function
                popup.querySelector("#saveBtn").addEventListener("click", async () => {
                    const price = parseFloat(popup.querySelector("#productPrice").value.replace(/,/g, ''));

                    if (isNaN(price) || price <= 0) {
                        Swal.fire("Error", "Please enter a valid price greater than 0.", "error");
                        return;
                    }

                    const updatedItem = {
                        _id: _id,
                        categoryName: popup.querySelector("#productID").value,
                        name: popup.querySelector("#productName").value,
                        location: popup.querySelector("#productLocation").value,
                        qty: parseInt(popup.querySelector("#productQuantity").value),
                        price: price,
                        reorderPoint: parseInt(popup.querySelector("#reorderPoint").value),
                        status: popup.querySelector('input[name="statusOptions"]:checked').value
                    };

                    try {
                        const updateResponse = await fetch(`http://localhost:5000/api/items/edit/` + _id, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updatedItem)
                        });

                        if (updateResponse.ok) {
                            Swal.fire("Saved!", "ข้อมูลได้ทำการแก้ไขแล้ว", "success").then(() => {
                                fetchItems();
                            });
                        } else {
                            Swal.fire("Error", "Failed to update product.", "error");
                        }
                    } catch (err) {
                        console.error("Error updating item:", err);
                        Swal.fire("Error", "An error occurred while updating the item.", "error");
                    }
                });

                // Close button with confirmation
                popup.querySelector("#closeBtn").addEventListener("click", () => {
                    Swal.fire({
                        title: "Are you sure?",
                        text: "The changes you made have not been saved. Do you want to cancel?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#d33",
                        cancelButtonColor: "#3085d6",
                        confirmButtonText: "Yes, cancel",
                        cancelButtonText: "No, keep editing"
                    }).then((result) => {
                        if (result.isConfirmed) {
                            Swal.close();
                        }
                    });
                });
            }
        });
    } catch (err) {
        console.error("Error fetching item:", err);
        Swal.fire("Error", "Failed to fetch item details.", "error");
    }
}

async function deleteItem(_id) {
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you really want to delete this item?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`http://localhost:5000/api/items/${_id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    Swal.fire("Deleted!", "The item has been deleted successfully.", "success").then(() => {
                        fetchItems();
                    });
                } else {
                    Swal.fire("Error", "Failed to delete item.", "error");
                }
            } catch (err) {
                console.error("Error deleting item:", err);
                Swal.fire("Error", "An error occurred while deleting the item.", "error");
            }
        }
    });
}

// Delete selected items
document.getElementById('deleteButton').addEventListener('click', function () {
    if (selectedItems.length === 0) {
        alert('Please select at least one item to delete.');
        return;
    }

    Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to delete selected items. This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete!',
        cancelButtonText: 'Cancel'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const deletePromises = selectedItems.map(id => fetch(`http://localhost:5000/api/items/${id}`, {
                    method: 'DELETE'
                }));

                const responses = await Promise.all(deletePromises);
                const allSuccessful = responses.every(response => response.ok);

                if (allSuccessful) {
                    Swal.fire('Deleted!', 'Selected items have been deleted.', 'success').then(() => {
                        fetchItems(); // Refresh the table
                    });
                } else {
                    Swal.fire('Error', 'Failed to delete some items.', 'error');
                }
            } catch (error) {
                console.error('Error deleting items:', error);
                Swal.fire('Error', 'An error occurred while deleting items.', 'error');
            }
        }
    });
});

fetchItems();