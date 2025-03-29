document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("report-items-body")) {
        console.error("❌ Table body element (#report-items-body) not found in the DOM.");
        return;
    }

    // Initialize data
    fetchReportItems();

    // Setup search input
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
    }
});

// Global variables
let currentPage = 1;
const itemsPerPage = 15;
let allItems = [];
let filteredItems = [];

async function fetchReportItems() {
    try {
        const response = await fetch('/api/items/report/withdrawals');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        console.log('Fetched items:', data.report);
        allItems = data.report;
        filteredItems = [...allItems];
        
        updatePaginationButtons(filteredItems.length);
        displayItems();
    } catch (error) {
        console.error('Error fetching report items:', error);
        alert('Failed to load report items');
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    filteredItems = allItems.filter(item => {
        const searchDate = item.date ? formatDateForSearch(item.date) : '';
        return (
            (item.categoryName && item.categoryName.toLowerCase().includes(searchTerm)) ||
            (item.location && item.location.toLowerCase().includes(searchTerm)) ||
            (item.itemName && item.itemName.toLowerCase().includes(searchTerm)) ||
            (item.itemId && item.itemId.toString().includes(searchTerm)) ||
            searchDate.includes(searchTerm)
        );
    });

    currentPage = 1;
    updatePaginationButtons(filteredItems.length);
    displayItems();
}

function displayItems() {
    const reportBody = document.getElementById('report-items-body');
    reportBody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

    if (itemsToDisplay.length === 0) {
        reportBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">No withdrawal records found</td>
            </tr>
        `;
        return;
    }

    itemsToDisplay.forEach((item, index) => {
        const row = document.createElement('tr');
        const itemNumber = startIndex + index + 1;
        row.innerHTML = `
            <td class="text-center">${itemNumber}</td>
            <td class="text-start">${item.categoryName || 'N/A'}</td>
            <td class="text-start">${item.itemName || 'N/A'}</td>
            <td class="text-start">${item.location || 'N/A'}</td>
            <td class="text-end">${formatInteger(item.remainingQty)}</td>
            <td class="text-end">${formatCurrency(item.price)}</td>
            <td class="text-end">${formatInteger(item.withdrawnQty)}</td>
            <td class="text-center">${formatDateTime(item.date)}</td>
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

// Existing helper functions remain unchanged
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
    const paginationEl = document.querySelector(".pagination");
    paginationEl.innerHTML = '';

    // Previous button
    paginationEl.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="prev">«</a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationEl.innerHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationEl.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="next">»</a>
        </li>
    `;

    // Add event listeners
    paginationEl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            handlePageChange(page);
        });
    });
}

function handlePageChange(page) {
    if (page === 'prev') currentPage--;
    else if (page === 'next') currentPage++;
    else currentPage = parseInt(page);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    displayItems();
}