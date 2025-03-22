document.addEventListener('DOMContentLoaded', function() {
    // Element references
    const locationSelect = document.getElementById('productLocation');
    const updateElements = {
        totalProfit: document.getElementById('totalProfit'),
        totalExpense: document.getElementById('totalExpense'),
        totalLoss: document.getElementById('totalLoss')
    };
    const errorContainer = document.getElementById('errorContainer');
    
    // Chart instances
    let monthlyChart = null;
    let productTrendsChart = null;
    
    // API configuration
    const API_BASE = 'http://localhost:5000/api/items';
    const locationMap = {
        'nst': 'Nakhon Si Thammarat',
        'krabi': 'Krabi',
        'All': 'all'
    };

    // Initial load
    loadData(locationSelect.value);

    // Event listeners
    locationSelect.addEventListener('change', function() {
        loadData(this.value);
    });

    // Core functions
    function loadData(location) {
        // Clear previous errors
        errorContainer.innerHTML = '';
        
        fetchOverviewData(location)
            .then(() => fetchChartData(location))
            .catch(error => {
                showError(error.message);
                console.error('Main Error:', error);
            });
    }

    async function fetchOverviewData(frontendLocation) {
        try {
            const backendLocation = locationMap[frontendLocation];
            const params = new URLSearchParams();
            
            if (backendLocation && backendLocation !== 'all') {
                params.append('location', backendLocation);
            }

            const response = await fetch(`${API_BASE}/overview?${params}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            updateDisplay(data.overview);
            
            return data;
        } catch (error) {
            showError('Failed to load overview data');
            throw error;
        }
    }

    async function fetchChartData(frontendLocation) {
        try {
            const backendLocation = locationMap[frontendLocation];
            const params = new URLSearchParams();
            
            if (backendLocation && backendLocation !== 'all') {
                params.append('location', backendLocation);
            }

            const response = await fetch(`${API_BASE}/overview/chart?${params}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            // Destroy existing charts
            if (monthlyChart) monthlyChart.destroy();
            if (productTrendsChart) productTrendsChart.destroy();

            // Create new charts
            renderMonthlyChart(data.monthlyOverview);
            renderProductTrendsChart(data.categoryOverview);
            
            return data;
        } catch (error) {
            showError('Failed to load chart data');
            throw error;
        }
    }

    // Chart functions
    function renderMonthlyChart(monthlyData) {
        const ctx = document.getElementById('monthlyChart');
        const sortedData = monthlyData.sort((a, b) => 
            new Date(a.month) - new Date(b.month)
        );

        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedData.map(d => d.month),
                datasets: [{
                    label: 'Profit',
                    data: sortedData.map(d => d.profit),
                    borderColor: '#4BC0C0',
                    tension: 0.4
                }, {
                    label: 'Expense',
                    data: sortedData.map(d => d.expense),
                    borderColor: '#FF6384',
                    tension: 0.4
                }]
            },
            options: chartOptions('y')
        });
    }

    function renderProductTrendsChart(categoryData) {
        const ctx = document.getElementById('productTrendsChart');
        const sortedData = categoryData.sort((a, b) => b.profit - a.profit);

        productTrendsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(d => d.category),
                datasets: [{
                    label: 'Profit',
                    data: sortedData.map(d => d.profit),
                    backgroundColor: '#36A2EB'
                }]
            },
            options: {
                ...chartOptions('x'),
                indexAxis: 'y',
            }
        });
    }

    // Helper functions
    function chartOptions(axis) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => 
                            `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y || ctx.parsed.x)}`
                    }
                }
            },
            scales: {
                [axis]: {
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        };
    }

    function updateDisplay(data) {
        updateElements.totalProfit.textContent = formatCurrency(data.totalProfit || 0);
        updateElements.totalExpense.textContent = formatCurrency(data.totalExpense || 0);
        updateElements.totalLoss.textContent = formatCurrency(data.totalLoss || 0);
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'THB',
            maximumFractionDigits: 0
        }).format(amount).replace('THB', '').trim();
    }

    function showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger mb-2';
        alertDiv.textContent = message;
        errorContainer.appendChild(alertDiv);
        
        setTimeout(() => alertDiv.remove(), 5000);
    }
});