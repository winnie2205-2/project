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
    
            // Create new charts with validation
            if (data.monthlyOverview) {
                renderAnnualRevenueChart(data.monthlyOverview);
            }
            if (data.categoryOverview) {
                renderTopProductsChart(data.categoryOverview);
            }
            
            return data;
        } catch (error) {
            showError('Failed to load chart data');
            throw error;
        }
    }
    
   // Modified chart functions
function renderAnnualRevenueChart(monthlyData) {
    const ctx = document.getElementById('monthlyChart');
    if (monthlyChart) monthlyChart.destroy();

    // Validate and process data
    if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
        console.error('Invalid monthly data format');
        return;
    }

    try {
        // Get the latest year from available data
        const latestYear = Math.max(...monthlyData.map(d => 
            new Date(d.month).getFullYear()
        ));

        // Aggregate data for the latest year
        const annualSummary = monthlyData
            .filter(d => new Date(d.month).getFullYear() === latestYear)
            .reduce((acc, curr) => ({
                profit: acc.profit + (curr.profit || 0),
                expense: acc.expense + (curr.expense || 0)
            }), { profit: 0, expense: 0 });

        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [`${latestYear} Annual Summary`],
                datasets: [
                    {
                        label: 'Profit',
                        data: [annualSummary.profit],
                        backgroundColor: '#4BC0C0'
                    },
                    {
                        label: 'Expense',
                        data: [annualSummary.expense],
                        backgroundColor: '#FF6384'
                    }
                ]
            },
            options: simplifiedChartOptions('y', true)
        });
    } catch (error) {
        console.error('Error processing annual data:', error);
        showError('Could not display annual summary chart');
    }
}

function renderTopCategoriesChart(categoryData) {
    const ctx = document.getElementById('productTrendsChart');
    if (productTrendsChart) productTrendsChart.destroy();

    // Validate and process data
    if (!Array.isArray(categoryData) || categoryData.length === 0) {
        console.error('Invalid category data format');
        return;
    }

    try {
        // Get top 10 products by profit
        const sortedData = categoryData
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 10);

        productTrendsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(d => d.productName), // ใช้ productName แทน category
                datasets: [{
                    label: 'Profit',
                    data: sortedData.map(d => d.profit),
                    backgroundColor: '#36A2EB'
                }]
            },
            options: simplifiedChartOptions('x', false)
        });
    } catch (error) {
        console.error('Error processing category data:', error);
        showError('Could not display product trends chart');
    }
}

// Modified data fetching
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

        // Create new charts with validation
        if (data.monthlyOverview) {
            renderAnnualRevenueChart(data.monthlyOverview);
        }
        if (data.categoryOverview) {
            renderTopCategoriesChart(data.categoryOverview);
        }
        
        return data;
    } catch (error) {
        showError('Failed to load chart data');
        throw error;
    }
}
// Add this function to your code
function simplifiedChartOptions(axis, showLegend) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: showLegend,
                position: 'top'
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => 
                        `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y || ctx.parsed.x)}`
                }
            }
        },
        scales: {
            [axis]: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatCurrency(value),
                    autoSkip: true,
                    maxRotation: 0
                },
                grid: { display: false }
            },
            x: { 
                display: axis === 'y',
                grid: { display: false }
            },
            y: { 
                display: axis === 'x',
                grid: { display: false }
            }
        },
        animation: false,
        borderWidth: 0
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