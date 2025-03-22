document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("report-items-body")) {
        console.error("❌ Table body element not found");
        return;
    }

    // Initialize
    fetchReportItems();
    setupSearch();
});

// Global variables
let currentPage = 1;
const itemsPerPage = 12;
let allItems = [];
let filteredItems = [];

async function fetchReportItems() {
    try {
        const response = await fetch('/api/items/report/items');
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        
        allItems = data;
        filteredItems = [...allItems];
        
        updatePaginationButtons(filteredItems.length);
        displayItems();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load report');
    }
}

function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    filteredItems = allItems.filter(item => {
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
                <td colspan="8" class="text-center">No items found</td>
            </tr>
        `;
        return;
    }

    itemsToDisplay.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-start">${item.categoryName || 'N/A'}</td>
            <td class="text-start">${item.name || 'N/A'}</td>
            <td class="text-start">${item.location || 'N/A'}</td>
            <td class="text-end">${formatInteger(item.qty)}</td>
            <td class="text-end">${formatCurrency(item.price)}</td>
            <td class="text-end">${formatCurrency(calculateAmount(item.qty, item.price))}</td>
            <td class="text-end">${formatInteger(item.reorderPoint)}</td>
            <td class="text-center">${formatDateTime(item.createdAt)}</td>
        `;
        reportBody.appendChild(row);
    });
}

// Helper functions
function formatInteger(value) {
    return parseFloat(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function formatCurrency(amount) {
    return parseFloat(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function calculateAmount(qty, price) {
    return parseFloat(qty || 0) * parseFloat(price || 0);
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function formatDateForSearch(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Pagination functions
function updatePaginationButtons(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationEl = document.querySelector(".pagination");
    if (!paginationEl) return;
    
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
            <li class="page-item ${parseInt(currentPage) === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationEl.innerHTML += `
        <li class="page-item ${currentPage >= totalPages || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="next">»</a>
        </li>
    `;

    // Event listeners
    paginationEl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            handlePageChange(page);
        });
    });
}

function handlePageChange(page) {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    
    if (page === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (page === 'next' && currentPage < totalPages) {
        currentPage++;
    } else if (page !== 'prev' && page !== 'next') {
        currentPage = parseInt(page);
    }

    // Ensure current page is within valid range
    currentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
    
    displayItems();
    updatePaginationButtons(filteredItems.length);
}

// Export functionality
document.addEventListener("DOMContentLoaded", () => {
    const exportButton = document.getElementById('Export');
    if (exportButton) {
        exportButton.addEventListener('click', exportToCSV);
    }
});

function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Category ID,Name,Location,Quantity,Price,Amount,Reorder Point,Date\n";

    filteredItems.forEach(item => {
        const row = [
            item.categoryName || '',
            item.name || '',
            item.location || '',
            formatNumber(item.qty),
            formatCurrency(item.price),
            formatCurrency(calculateAmount(item.qty, item.price)),
            formatNumber(item.reorderPoint),
            formatDateTime(item.createdAt)
        ].map(field => `"${field || ''}"`).join(',');
        
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `item-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}