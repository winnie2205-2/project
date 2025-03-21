let currentPage = 1; // Track the current page
const itemsPerPage = 8; // Number of items to display per page
let allItems = []; // Store all items fetched from the API

async function fetchItems() {
    console.log('Fetching items...');
    try {
        const response = await fetch('http://localhost:5000/api/items');
        if (!response.ok) {
            throw new Error('Failed to fetch items');
        }
        const items = await response.json();
        allItems = items; // Store all items for pagination

        displayItems(items); // Display items on the current page
        updatePaginationButtons(items.length); // Update pagination buttons
    } catch (err) {
        console.error('Error fetching items:', err);
        alert('Failed to load items. Please check console for details.');
    }
}

function displayItems(items) {
    const tableBody = document.getElementById('itemTableBody');
    if (!tableBody) {
        throw new Error('Table body element not found');
    }

    tableBody.innerHTML = ''; // Clear old data

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = items.slice(startIndex, endIndex);

    itemsToDisplay.forEach((item, index) => {
        const row = document.createElement('tr');

        // Use alertLevel from API
        let rowClass = '';
        if (item.alertLevel === 'danger') {
            rowClass = 'table-danger'; // Red (stock below or equal to reorderPoint)
        } else if (item.alertLevel === 'warning') {
            rowClass = 'table-warning'; // Yellow (stock below reorderPoint * 1.15)
        } else {
            rowClass = 'table-success'; // Green (normal)
        }

        row.classList.add(rowClass);

        // Format price to 2 decimal places
        const formattedPrice = parseFloat(item.price).toFixed(2);

        row.innerHTML = `
            <td class="text-center">${startIndex + index + 1}</td>  
            <td class="text-center">${item.categoryName}</td> 
            <td class="text-center">${item.name}</td>  
            <td class="text-center">${item.location}</td>  
            <td class="text-center">${item.qty}</td>  
            <td class="text-center">${formattedPrice}</td>  <!-- Display formatted price -->
            <td class="text-center">${item.status}</td>  
            <td class="text-center" style="white-space: nowrap;">
                <div class="d-flex justify-content-center gap-2">
                    <button class="btn text-primary border-0 bg-transparent p-1 fs-4" onclick="showEditBox('${item._id}')">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn text-danger border-0 bg-transparent p-1 fs-4" onclick="deleteItem('${item._id}')">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to update pagination buttons
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
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">«</a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Next button
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">»</a>
        </li>
    `;
}

// Function to change page
function changePage(page) {
    if (page < 1 || page > Math.ceil(allItems.length / itemsPerPage)) return;
    currentPage = page;
    displayItems(allItems); // Re-render items for the new page
}

// Call fetchItems on page load
window.onload = function () {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in first.");
        window.location.href = '/index.html';
        return;
    }

    fetchItems(); // Fetch items when the page loads
};

async function showEditBox(_id) {  // ใช้ _id แทน id ที่ส่งมา
    try {
        console.log("Fetching item with ID:", _id);
        // ดึงข้อมูลสินค้าจาก API
        const response = await fetch(`http://localhost:5000/api/items/` + _id);  // ใช้ _id ในการดึงข้อมูล
        if (!response.ok) {
            throw new Error('Failed to fetch item details');
        }
        const item = await response.json();

        // เปิด SweetAlert พร้อมฟอร์มแก้ไข
        Swal.fire({
            html: `
            <div class="container justify-content-center mt-5">
                <div class="d-flex justify-content-center">
                    <div class="card" style="background: #ebe3ce;width: 500px;max-width: inherit;">
                        <div class="card-header text-center" style="background: #ebe3ce;">
                            <h5 style="font-weight: bold;">Edit Product Information</h5>
                        </div>
                        <div class="card-body">
                            <form>
                                <div class="mb-3"><label class="form-label" for="productID" style="color: #ca0000;">ID*</label><input class="form-control form-control" type="text" id="productID" placeholder="Product ID" value="${item.category}" style="background: #ffffff;box-shadow: 0px 0px 5px 2px;"></div>
                                <div class="mb-3"><label class="form-label" for="productName" style="color: #ca0000;">Name*</label><input class="form-control form-control" type="text" id="productName" placeholder="Name of the product" value="${item.name}" style="background: #ffffff;box-shadow: 0px 0px 5px 2px;"></div>
                                <div class="mb-3"><label class="form-label" for="productLocation" style="color: #ca0000;">Location*</label><select class="form-select form-select" id="productLocation" style="background: #ffffff;box-shadow: 0px 0px 5px 2px;">
                                    <option ue="Nakhon Si Thammarat" ${item.location === 'Nakhon Si Thammarat' ? 'selected' : ''}>Nakhon Si Thammarat</option>
                                    <option ue="Krabi" ${item.location === 'Krabi' ? 'selected' : ''}>Krabi</option>
                                </select></div>
                                <div class="mb-3"><label class="form-label" for="productQuantity" style="color: #ca0000;">Quantity*</label><input class="form-control form-control" type="number" id="productQuantity" min="0" placeholder="Quantity" value="${item.qty}" style="background: #ffffff;box-shadow: 0px 0px 5px 2px;"></div>
                                <div class="mb-3"><label class="form-label" for="productPrice" style="color: #ca0000;">Prices (THB) / Product*</label><input class="form-control form-control" type="number" id="productPrice" placeholder="Price (THB)" value="${item.price}" style="background: #ffffff;box-shadow: 0px 0px 5px 2px;"></div>
                                <div class="d-flex justify-content-between align-items-center mb-3 reorder-status-box">
                                    <div class="reorder-box"><label class="form-label" for="reorderPoint" style="color: #ca0000;">Reorder Point*</label>
                                        <div class="input-group"><button class="btn btn-outline-secondary" type="button" id="decreaseReorder" style="width: 50px;background: #dc7b09;color: rgb(255,255,255);font-weight: bold;font-size: 16px;border-style: solid;border-color: rgb(0,0,0);">-</button><input class="form-control form-control text-center" type="text" id="reorderPoint"  value="${item.reorderPoint || null}" style="width: 50px;border: 1px solid rgb(0,0,0);"><button class="btn btn-outline-secondary" type="button" id="increaseReorder" style="width: 50px;background: #dc7b09;color: rgb(255,255,255);font-weight: bold;font-size: 16px;border-style: solid;border-color: rgb(0,0,0);">+</button></div>
                                    </div>
                                    <div class="status-box"><label class="form-label" style="color: #ca0000;">Status*</label>
                                        <div class="d-flex">
                                            <div class="form-check me-2">
                                                <input type="radio" class="form-check-input" id="statusEnable" name="statusOptions" value="Enable" ${item.status === 'Enable' ? 'checked' : ''}>
                                                <label class="form-check-label" for="statusEnable">Enable</label>
                                            </div>
                                            <div class="form-check">
                                                <input type="radio" class="form-check-input" id="statusDisable" name="statusOptions" value="Disable" ${item.status === 'Disable' ? 'checked' : ''}>
                                                <label class="form-check-label" for="statusDisable">Disable</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-end mt-4">
                                    <a class="btn btn-secondary me-2" role="button" style="background: #ebe3ce;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;padding: 7px 12px;border-radius: 50px;" href="inventory.html">Close</a>
                                    <a class="btn btn-success" role="button" style="background: #28aa4a;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;border-radius: 50px;padding-top: 7px;padding-bottom: 7px;" href="javascript:void(0);" id="saveBtn">Save</a>
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

                // Save function
                popup.querySelector("#saveBtn").addEventListener("click", async () => {
                    // Get the price value and convert it to a decimal
                    const price = popup.querySelector("#productPrice").value;
                    const decimalPrice = parseFloat(price);

                    // Validate the price input
                    if (isNaN(decimalPrice) || decimalPrice <= 0) {
                        Swal.fire("Error", "Please enter a valid price greater than 0.", "error");
                        return; // Exit the function if the price is invalid or less than or equal to 0
                    }

                    // Collect updated item data
                    const updatedItem = {
                        _id: _id,
                        categoryName: popup.querySelector("#productID").value,
                        name: popup.querySelector("#productName").value,
                        location: popup.querySelector("#productLocation").value,
                        qty: parseInt(popup.querySelector("#productQuantity").value), // Ensure quantity is an integer
                        price: decimalPrice, // Use the decimal price here
                        reorderPoint: popup.querySelector("#reorderPoint").value,
                        status: popup.querySelector('input[name="statusOptions"]:checked').value
                    };

                    console.log("Updated Item:", updatedItem);  // ตรวจสอบข้อมูลที่ถูกส่ง
                    console.log("Fetching item with ID ON-EDIT:", _id);

                    try {
                        // Send the updated item to the backend
                        const updateResponse = await fetch(`http://localhost:5000/api/items/edit/` + _id, {  // ใช้ id ในการส่งข้อมูล
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(updatedItem)
                        });

                        if (updateResponse.ok) {
                            Swal.fire("Saved!", "ข้อมูลได้ทำการแก้ไขแล้ว", "success").then(() => {
                                fetchItems(); // โหลดรายการใหม่หลังจากแก้ไขเสร็จ
                            });
                        } else {
                            Swal.fire("Error", "Failed to update product.", "error");
                        }
                    } catch (err) {
                        console.error("Error updating item:", err);
                        Swal.fire("Error", "An error occurred while updating the item.", "error");
                    }
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
    })};


    document.getElementById('searchInput').addEventListener('input', function(event) {
        // alert('real')
        const searchQuery = event.target.value.trim();
        const tableBody = document.getElementById('itemTableBody');
        
        // เคลียร์ข้อมูลเก่าในตาราง
        if (tableBody) {
            tableBody.innerHTML = '';
        }
    
        if (searchQuery !== "") {
            // alert(searchQuery)
            console.log('searchQuery:',searchQuery)
            const x = fetch(`/api/items/search_item?name=${String(searchQuery)}`) // ใช้เส้นทางสำหรับการค้นหา
                .then(response => response.json())
                .then(data => {
                    console.log('data:',data)
                    if (data.length === 0) {
                        // ถ้าไม่พบข้อมูล ให้แสดงข้อความ "ไม่มีข้อมูล"
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td colspan="8" class="text-center">ไม่มีข้อมูลที่ตรงกับคำค้นหา</td>
                        `;
                        tableBody.appendChild(row);
                    } else {
                        // ถ้ามีข้อมูลให้แสดงข้อมูล
                        data.forEach((item, index) => {
                            // console.log(':::',item)
                            const row = document.createElement('tr');
                            row.innerHTML = `
                            <td class="text-center">${index + 1}</td>  
                            <td class="text-center">${item.categoryID.categoryName}</td>
                            <td class="text-center">${item.name}</td>  
                            <td class="text-center">${item.location}</td>  
                            <td class="text-center">${item.qty}</td>  
                            <td class="text-center">${item.price}</td>  
                            <td class="text-center">${item.status}</td>  
                            <td class="text-center">
                                <button class="btn text-primary border-0 bg-transparent p-1 fs-4" onclick="showEditBox('${item._id}')">
                                    <i class="bi bi-pencil-square"></i>
                                </button>
                                <button class="btn text-danger border-0 bg-transparent p-1 fs-4" onclick="deleteItem('${item._id}')">
                                    <i class="bi bi-trash3-fill"></i>
                                </button>
                            </td>
                        `;
                            tableBody.appendChild(row);
                        });
                    }
                })
                .catch(error => {
                    // alert("ไม่สามารถค้นหาข้อมูลได้ กรุณาลองใหม่อีกครั้ง!");

                });
        } else {
            // ถ้าไม่มีคำค้นหา ให้แสดงข้อมูลทั้งหมด
            fetch(`/api/items`)  // ดึงข้อมูลทั้งหมด
                .then(response => response.json())
                .then(data => {
                    if (data.length === 0) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td colspan="8" class="text-center">ไม่มีข้อมูล</td>
                        `;
                        tableBody.appendChild(row);
                    } else {
                        console.log('xaxa:',data)
                        data.forEach((item, index) => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                            <td class="text-center">${index + 1}</td>  
                            <td class="text-center">${item.categoryName}</td>
                            <td class="text-center">${item.name}</td>  
                            <td class="text-center">${item.location}</td>  
                            <td class="text-center">${item.qty}</td>  
                            <td class="text-center">${item.price}</td>  
                            <td class="text-center">${item.status}</td>  
                            <td class="text-center">
                                <button class="btn text-primary border-0 bg-transparent p-1 fs-4" onclick="showEditBox('${item._id}')">
                                    <i class="bi bi-pencil-square"></i>
                                </button>
                                <button class="btn text-danger border-0 bg-transparent p-1 fs-4" onclick="deleteItem('${item._id}')">
                                    <i class="bi bi-trash3-fill"></i>
                                </button>
                            </td>
                        `;
                            tableBody.appendChild(row);
                        });
                    }
                })
                .catch(error => {
                    alert("ไม่สามารถดึงข้อมูลทั้งหมดได้ กรุณาลองใหม่อีกครั้ง!");
                });
        }
    });    
    
fetchItems();
