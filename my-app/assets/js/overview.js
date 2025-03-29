// overview.js
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
        errorContainer.innerHTML = '';
        Promise.all([fetchOverviewData(location), fetchChartData(location)])
            .catch(error => {
                showError(error.message);
                console.error('Loading Error:', error);
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
            
            const { monthlyOverview, categoryOverview } = await response.json();
            
            destroyCharts();
            if (monthlyOverview.length) renderMonthlyChart(monthlyOverview);
            if (categoryOverview.length) renderProductChart(categoryOverview);
            
            return { monthlyOverview, categoryOverview };
        } catch (error) {
            showError('Failed to load chart data');
            throw error;
        }
    }

    function renderMonthlyChart(monthlyData) {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        if (monthlyChart) monthlyChart.destroy();

        // Group data by year
        const yearlyData = monthlyData.reduce((acc, curr) => {
            const year = curr.month.split(' ')[1];
            if (!acc[year]) {
                acc[year] = { revenue: 0, expense: 0 };
            }
            acc[year].revenue += curr.revenue;
            acc[year].expense += curr.expense;
            return acc;
        }, {});

        const years = Object.keys(yearlyData);
        const revenues = years.map(year => yearlyData[year].revenue);
        const expenses = years.map(year => yearlyData[year].expense);

        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Revenue',
                    data: revenues,
                    backgroundColor: '#4BC0C0',
                    borderWidth: 1
                }, {
                    label: 'Expense',
                    data: expenses,
                    backgroundColor: '#FF6384',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { font: { size: 14 } }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Year' },
                        grid: { display: false },
                        ticks: { font: { size: 12 } }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value),
                            font: { size: 12 }
                        },
                        grid: { color: '#f0f0f0' }
                    }
                }
            }
        });
    }
    function renderProductChart(productData) {
        const ctx = document.getElementById('productTrendsChart').getContext('2d');
        if (productTrendsChart) productTrendsChart.destroy();
    
        const sortedProducts = productData
            .sort((a, b) => (b.revenue - b.expense) - (a.revenue - a.expense))
            .slice(0, 10);
    
        productTrendsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedProducts.map(() => ''), // Empty labels
                datasets: [{
                    label: 'Net Profit',
                    data: sortedProducts.map(d => d.revenue - d.expense),
                    backgroundColor: '#36A2EB',
                    borderWidth: 1,
                    // Add product name to each data point
                    productNames: sortedProducts.map(d => d.productName)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(tooltipItems) {
                                // Explicitly get product name from the data
                                const dataset = tooltipItems[0].dataset;
                                const index = tooltipItems[0].dataIndex;
                                return dataset.productNames[index] || 'Unknown Product';
                            },
                            label: function(context) {
                                const index = context.dataIndex;
                                const product = sortedProducts[index];
                                return [
                                    `Net Profit: ${formatCurrency(context.parsed.y)}`,
                                ];
                            }
                        }
                    },
                    legend: { display: false }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Product Name'
                        },
                        ticks: { 
                            display: false // Hide x-axis ticks and labels
                        },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value),
                            font: { size: 12 }
                        },
                        grid: { color: '#f0f0f0' }
                    }
                }
            }
        });
    }
    function updateDisplay({ totalRevenue, totalExpense, totalLoss }) {
        updateElements.totalProfit.textContent = formatCurrency(totalRevenue);
        updateElements.totalExpense.textContent = formatCurrency(totalExpense);
        updateElements.totalLoss.textContent = formatCurrency(totalLoss);
    }

    function destroyCharts() {
        if (monthlyChart) {
            monthlyChart.destroy();
            monthlyChart = null;
        }
        if (productTrendsChart) {
            productTrendsChart.destroy();
            productTrendsChart = null;
        }
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    function showError(message) {
        errorContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
});