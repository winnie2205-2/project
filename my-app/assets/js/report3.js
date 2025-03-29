document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.querySelector(".table tbody");
    if (!tableBody) {
        console.error("❌ Table body element not found");
        return;
    }
    await fetchLowStockItems();
});

// Initialize data
let currentPage = 1;
const itemsPerPage = 15;
let allLowStockItems = [];
let filteredItems = [];

async function fetchLowStockItems() {
    try {
        const response = await fetch('/api/items/report/low-stock');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        allLowStockItems = await response.json();
        filteredItems = allLowStockItems;
        console.log("✅ Fetched items:", allLowStockItems);

        updatePaginationButtons(filteredItems.length);
        displayLowStockItems();
    } catch (error) {
        console.error('🚨 Error:', error);
        alert('❌ Failed to load low stock items');
    }
}

// Setup search input
const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    filteredItems = allLowStockItems.filter(item => {
        const searchDate = item.createdAt ? formatDateForSearch(item.createdAt) : '';
        return (
            (item.categoryName && item.categoryName.toLowerCase().includes(searchTerm)) ||
            (item.location && item.location.toLowerCase().includes(searchTerm)) ||
            (item.name && item.name.toLowerCase().includes(searchTerm)) ||
            (item._id && item._id.toString().includes(searchTerm)) ||
            searchDate.includes(searchTerm)
        );
    });

    currentPage = 1;
    updatePaginationButtons(filteredItems.length);
    displayLowStockItems();
}

function displayLowStockItems() {
    const reportBody = document.querySelector('.table tbody');
    reportBody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredItems.length);
    const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

    if (itemsToDisplay.length === 0) {
        reportBody.innerHTML = `<tr><td colspan="8" class="text-center">No low stock items found</td></tr>`;
        return;
    }

    itemsToDisplay.forEach((item, index) => {
        const row = document.createElement('tr');
        const itemNumber = startIndex + index + 1;
        row.innerHTML = `
            <td class="text-center">${itemNumber}</td>
            <td class="text-start">${item.categoryName || 'N/A'}</td>
            <td class="text-start">${item.name}</td>
            <td class="text-start">${item.location}</td>
            <td class="text-end">${formatInteger(item.qty)}</td>
            <td class="text-end">${formatCurrency(item.price)}</td>
            <td class="text-end">${formatInteger(item.reorderPoint)}</td>
            <td class="text-center">${formatDateTime(item.createdAt)}</td>
        `;
        reportBody.appendChild(row);
    });
}

// New helper function for integer formatting
function formatInteger(value) {
    return parseFloat(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Existing helper functions
function formatCurrency(amount) {
    return parseFloat(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Updated date formatting functions
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    
    // Format date as dd/mm/yy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Last two digits of year
    
    // Format time with 12-hour clock and AM/PM
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const twelveHours = hours % 12 || 12; // Convert to 12-hour format

    return `${day}/${month}/${year} ${twelveHours}:${minutes}:${seconds} ${ampm}`;
}

function formatDateForSearch(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}
// Pagination functions
function updatePaginationButtons(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.querySelector(".pagination");
    if (!pagination) {
        console.error("❌ Pagination element not found!");
        return;
    }
    pagination.innerHTML = "";

    // Create Previous button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    
    const prevA = document.createElement("a");
    prevA.className = "page-link";
    prevA.href = "#";
    prevA.textContent = "«";
    if (currentPage !== 1) {
        prevA.addEventListener("click", (event) => {
            event.preventDefault();
            changePage(currentPage - 1);
        });
    }
    
    prevLi.appendChild(prevA);
    pagination.appendChild(prevLi);

    // Create page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? "active" : ""}`;
        
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "#";
        a.textContent = i;
        a.addEventListener("click", (event) => {
            event.preventDefault();
            changePage(i);
        });
        
        li.appendChild(a);
        pagination.appendChild(li);
    }

    // Create Next button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`;
    
    const nextA = document.createElement("a");
    nextA.className = "page-link";
    nextA.href = "#";
    nextA.textContent = "»";
    if (currentPage !== totalPages && totalPages !== 0) {
        nextA.addEventListener("click", (event) => {
            event.preventDefault();
            changePage(currentPage + 1);
        });
    }
    
    nextLi.appendChild(nextA);
    pagination.appendChild(nextLi);
}

function changePage(page) {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayLowStockItems();
    updatePaginationButtons(filteredItems.length);
}
