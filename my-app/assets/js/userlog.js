// document.addEventListener("DOMContentLoaded", () => {
//     const tableBody = document.getElementById("logTableBody");
//     const pagination = document.getElementById("pagination");
//     const searchInput = document.getElementById("searchInput");
//     const logoutBtn = document.getElementById("logoutBtn");
    
//     // Pagination settings
//     let currentPage = 1;
//     const logsPerPage = 10;
//     let allLogs = [];
    
//     // Load user info from local storage
//     const loadUserInfo = () => {
//         const username = localStorage.getItem('username') || 'User';
//         const avatarURL = localStorage.getItem('avatarURL') || 'assets/img/default-avatar.png';
        
//         document.getElementById('username').textContent = username;
//         document.getElementById('userAvatar').src = avatarURL;
//     };
    
//     // Format date to Thai locale
//     const formatDate = (dateString) => {
//         return new Date(dateString).toLocaleString("th-TH", { 
//             day: "2-digit", 
//             month: "2-digit", 
//             year: "numeric",
//             hour: "2-digit", 
//             minute: "2-digit", 
//             second: "2-digit"
//         });
//     };
    
//     // Filter logs based on search term
//     const filterLogs = (logs, searchTerm) => {
//         if (!searchTerm) return logs;
        
//         searchTerm = searchTerm.toLowerCase();
//         return logs.filter(log => 
//             (log.userID?.username || "").toLowerCase().includes(searchTerm) ||
//             (log.action || "").toLowerCase().includes(searchTerm) ||
//             (log.ipAddress || "").toLowerCase().includes(searchTerm)
//         );
//     };
    
//     // Render the logs table
//     const renderTable = (logs) => {
//         if (!logs || logs.length === 0) {
//             tableBody.innerHTML = `<tr><td colspan="4" class="text-center">No logs found</td></tr>`;
//             pagination.innerHTML = '';
//             return;
//         }
        
//         // Calculate pagination
//         const startIndex = (currentPage - 1) * logsPerPage;
//         const endIndex = startIndex + logsPerPage;
//         const paginatedLogs = logs.slice(startIndex, endIndex);
//         const totalPages = Math.ceil(logs.length / logsPerPage);
        
//         // Clear table
//         tableBody.innerHTML = '';
        
//         // Add logs to table
//         paginatedLogs.forEach(log => {
//             const row = document.createElement("tr");
//             row.innerHTML = `
//                 <td>${log.userID?.username || "Unknown"}</td>
//                 <td>${log.action || "N/A"}</td>
//                 <td>${log.timestamp ? formatDate(log.timestamp) : "N/A"}</td>
//                 <td>${log.ipAddress || "N/A"}</td>
//             `;
//             tableBody.appendChild(row);
//         });
        
//         // Render pagination
//         renderPagination(totalPages);
//     };
    
//     // Render pagination controls
//     const renderPagination = (totalPages) => {
//         if (totalPages <= 1) {
//             pagination.innerHTML = '';
//             return;
//         }
        
//         let paginationHTML = '';
        
//         // Previous button
//         paginationHTML += `
//             <li>
//                 <a href="#" data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
//                     ❮
//                 </a>
//             </li>
//         `;
        
//         // Page numbers
//         const maxVisiblePages = 5;
//         let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
//         let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
//         if (endPage - startPage + 1 < maxVisiblePages) {
//             startPage = Math.max(1, endPage - maxVisiblePages + 1);
//         }
        
//         for (let i = startPage; i <= endPage; i++) {
//             paginationHTML += `
//                 <li>
//                     <a href="#" data-page="${i}" class="${currentPage === i ? 'active' : ''}">${i}</a>
//                 </li>
//             `;
//         }
        
//         // Next button
//         paginationHTML += `
//             <li>
//                 <a href="#" data-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
//                     ❯
//                 </a>
//             </li>
//         `;
        
//         pagination.innerHTML = paginationHTML;
        
//         // Add event listeners to pagination buttons
//         document.querySelectorAll('#pagination a').forEach(button => {
//             button.addEventListener('click', (e) => {
//                 e.preventDefault();
//                 const page = parseInt(e.target.getAttribute('data-page'));
//                 currentPage = page;
//                 renderTable(filterLogs(allLogs, searchInput.value.trim()));
//             });
//         });
//     };
    
//     // Fetch logs from API
//     const fetchLogs = async () => {
//         try {
//             showLoadingIndicator();
            
//             const token = localStorage.getItem('token');
            
//             if (!token) {
//                 showError("No authentication token found. Please log in.");
//                 setTimeout(() => window.location.href = "/loading.html", 2000);
//                 return;
//             }
            
//             const response = await fetch("http://localhost:5000/api/users/data_logs", {
//                 method: "GET",
//                 headers: {
//                     "Authorization": `Bearer ${token}`
//                 }
//             });
            
//             if (!response.ok) {
//                 if (response.status === 401 || response.status === 403) {
//                     localStorage.removeItem('token');
//                     showError("Session expired. Redirecting to login...");
//                     setTimeout(() => window.location.href = "/loading.html", 2000);
//                     return;
//                 }
//                 throw new Error(`HTTP Error: ${response.status}`);
//             }
            
//             const logs = await response.json();
            
//             if (!Array.isArray(logs)) {
//                 throw new Error("Invalid data format received from server");
//             }
            
//             allLogs = logs;
//             renderTable(allLogs);
            
//         } catch (error) {
//             console.error("Error fetching logs:", error);
//             showError("Failed to load logs. Please try again later.");
//         }
//     };
    
//     // Show loading indicator
//     const showLoadingIndicator = () => {
//         tableBody.innerHTML = `
//             <tr>
//                 <td colspan="4" style="text-align: center; padding: 20px;">
//                     <div class="loading-spinner"></div>
//                     <p>Loading logs...</p>
//                 </td>
//             </tr>
//         `;
//     };
    
//     // Show error message
//     const showError = (message) => {
//         tableBody.innerHTML = `
//             <tr>
//                 <td colspan="4" class="error-message">
//                     ${message}
//                 </td>
//             </tr>
//         `;
//     };
    
//     // Handle search input
//     searchInput.addEventListener('input', () => {
//         currentPage = 1;
//         renderTable(filterLogs(allLogs, searchInput.value.trim()));
//     // })
    
//     // Handle logout
//     logoutBtn.addEventListener('click', () => {
//         localStorage.removeItem('token');
//         localStorage.removeItem('username');
//         window.location.href = '/loading.html';
//     });
    
//     // Initialize
//     loadUserInfo();
//     fetchLogs();
    
//     // Refresh logs every 5 minutes
//     setInterval(fetchLogs, 5 * 60 * 1000);
// });