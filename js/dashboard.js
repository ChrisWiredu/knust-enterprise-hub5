// Business Dashboard JavaScript

class BusinessDashboard {
    constructor() {
        this.currentUser = null;
        this.businesses = [];
        this.charts = {};
        this.init();
    }

    async init() {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        try {
            // Get user profile
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();
            this.currentUser = data.data;
            this.updateUI();
            
            // Load dashboard data
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    }

    updateUI() {
        // Update navigation
        const authNavText = document.getElementById('authNavText');
        if (authNavText) {
            authNavText.textContent = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
        }

        // Update dropdown menu
        const authDropdownMenu = document.getElementById('authDropdownMenu');
        if (authDropdownMenu) {
            authDropdownMenu.innerHTML = `
                <li><a class="dropdown-item" href="#" onclick="dashboard.showProfile()">
                    <i class="fas fa-user me-2"></i> Profile
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="dashboard.showSettings()">
                    <i class="fas fa-cog me-2"></i> Settings
                </a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" onclick="dashboard.logout()">
                    <i class="fas fa-sign-out-alt me-2"></i> Logout
                </a></li>
            `;
        }
    }

    async loadDashboardData() {
        try {
            // Load user's businesses
            await this.loadBusinesses();
            
            // Load analytics
            await this.loadAnalytics();
            
            // Initialize charts
            this.initializeCharts();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showAlert('Failed to load dashboard data', 'danger');
        }
    }

    async loadBusinesses() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/businesses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.businesses = data.data;
                this.renderBusinessesTable();
                this.updateStats();
            } else {
                throw new Error('Failed to load businesses');
            }
        } catch (error) {
            console.error('Error loading businesses:', error);
            this.showAlert('Failed to load businesses', 'danger');
        }
    }

    renderBusinessesTable() {
        const tbody = document.getElementById('businessesTableBody');
        
        if (this.businesses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <i class="fas fa-store fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No businesses found</p>
                        <button class="btn btn-primary" onclick="dashboard.showAddBusinessModal()">
                            <i class="fas fa-plus me-2"></i>Create Your First Business
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.businesses.map(business => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${business.logo_url || 'img2/losb.jpg'}" 
                             alt="${business.name}" 
                             class="rounded-circle me-3" 
                             style="width: 40px; height: 40px; object-fit: cover;">
                        <div>
                            <h6 class="mb-0">${business.name}</h6>
                            <small class="text-muted">${business.description.substring(0, 50)}...</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge bg-primary">${business.category}</span>
                </td>
                <td>${business.location}</td>
                <td>
                    <span class="badge ${business.is_active ? 'bg-success' : 'bg-secondary'}">
                        ${business.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${business.total_orders || 0}</td>
                <td>GHS ${(business.total_revenue || 0).toFixed(2)}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="dashboard.viewBusiness(${business.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="dashboard.editBusiness(${business.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="dashboard.deleteBusiness(${business.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const totalBusinesses = this.businesses.length;
        const totalOrders = this.businesses.reduce((sum, business) => sum + (business.total_orders || 0), 0);
        const totalViews = this.businesses.reduce((sum, business) => sum + (business.total_views || 0), 0);
        const totalRevenue = this.businesses.reduce((sum, business) => sum + (business.total_revenue || 0), 0);

        document.getElementById('totalBusinesses').textContent = totalBusinesses;
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalViews').textContent = totalViews;
        document.getElementById('totalRevenue').textContent = `GHS ${totalRevenue.toFixed(2)}`;
    }

    async loadAnalytics() {
        // This would load analytics data from the backend
        // For now, we'll use mock data
        this.analyticsData = {
            revenue: this.generateMockRevenueData(),
            performance: this.generateMockPerformanceData()
        };
    }

    generateMockRevenueData() {
        const data = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toISOString().split('T')[0],
                revenue: Math.floor(Math.random() * 500) + 100
            });
        }
        
        return data;
    }

    generateMockPerformanceData() {
        return {
            views: Math.floor(Math.random() * 1000) + 500,
            orders: Math.floor(Math.random() * 100) + 20,
            revenue: Math.floor(Math.random() * 5000) + 1000,
            customers: Math.floor(Math.random() * 50) + 10
        };
    }

    initializeCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: this.analyticsData.revenue.map(d => d.date),
                    datasets: [{
                        label: 'Revenue (GHS)',
                        data: this.analyticsData.revenue.map(d => d.revenue),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'GHS ' + value;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx) {
            this.charts.performance = new Chart(performanceCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Views', 'Orders', 'Revenue', 'Customers'],
                    datasets: [{
                        data: [
                            this.analyticsData.performance.views,
                            this.analyticsData.performance.orders,
                            this.analyticsData.performance.revenue,
                            this.analyticsData.performance.customers
                        ],
                        backgroundColor: [
                            '#007bff',
                            '#28a745',
                            '#ffc107',
                            '#dc3545'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    showAddBusinessModal() {
        const modal = new bootstrap.Modal(document.getElementById('addBusinessModal'));
        modal.show();
    }

    async createBusiness() {
        try {
            const formData = {
                name: document.getElementById('businessName').value,
                description: document.getElementById('businessDescription').value,
                category: document.getElementById('businessCategory').value,
                location: document.getElementById('businessLocation').value,
                contact_number: document.getElementById('businessContact').value,
                whatsapp_link: document.getElementById('businessWhatsapp').value,
                instagram_handle: document.getElementById('businessInstagram').value,
                operating_hours: document.getElementById('businessHours').value
            };

            const token = localStorage.getItem('token');
            const response = await fetch('/api/businesses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showAlert('Business created successfully!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('addBusinessModal')).hide();
                document.getElementById('addBusinessForm').reset();
                await this.loadBusinesses();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create business');
            }
        } catch (error) {
            console.error('Error creating business:', error);
            this.showAlert(error.message || 'Failed to create business', 'danger');
        }
    }

    async viewBusiness(businessId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/businesses/${businessId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showBusinessDetailModal(data.data);
            } else {
                throw new Error('Failed to load business details');
            }
        } catch (error) {
            console.error('Error viewing business:', error);
            this.showAlert('Failed to load business details', 'danger');
        }
    }

    showBusinessDetailModal(business) {
        const content = document.getElementById('businessDetailContent');
        content.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <img src="${business.logo_url || 'img2/losb.jpg'}" 
                                     alt="${business.name}" 
                                     class="rounded me-3" 
                                     style="width: 80px; height: 80px; object-fit: cover;">
                                <div>
                                    <h4 class="mb-1">${business.name}</h4>
                                    <p class="text-muted mb-0">${business.category}</p>
                                    <span class="badge ${business.is_active ? 'bg-success' : 'bg-secondary'}">
                                        ${business.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <p class="card-text">${business.description}</p>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Location:</strong> ${business.location}
                                </div>
                                <div class="col-md-6">
                                    <strong>Contact:</strong> ${business.contact_number}
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Total Orders:</strong> ${business.total_orders || 0}
                                </div>
                                <div class="col-md-6">
                                    <strong>Total Revenue:</strong> GHS ${(business.total_revenue || 0).toFixed(2)}
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <strong>Average Rating:</strong> ${business.average_rating || 0}/5
                                </div>
                                <div class="col-md-6">
                                    <strong>Total Reviews:</strong> ${business.total_reviews || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Quick Actions</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="dashboard.editBusiness(${business.id})">
                                    <i class="fas fa-edit me-2"></i>Edit Business
                                </button>
                                <button class="btn btn-success" onclick="dashboard.manageProducts(${business.id})">
                                    <i class="fas fa-box me-2"></i>Manage Products
                                </button>
                                <button class="btn btn-info" onclick="dashboard.viewAnalytics(${business.id})">
                                    <i class="fas fa-chart-line me-2"></i>View Analytics
                                </button>
                                <button class="btn btn-warning" onclick="dashboard.viewOrders(${business.id})">
                                    <i class="fas fa-shopping-cart me-2"></i>View Orders
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('businessDetailModal'));
        modal.show();
    }

    async editBusiness(businessId) {
        // Implementation for editing business
        this.showAlert('Edit functionality coming soon!', 'info');
    }

    async deleteBusiness(businessId) {
        if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/businesses/${businessId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.showAlert('Business deleted successfully!', 'success');
                await this.loadBusinesses();
            } else {
                throw new Error('Failed to delete business');
            }
        } catch (error) {
            console.error('Error deleting business:', error);
            this.showAlert('Failed to delete business', 'danger');
        }
    }

    refreshBusinesses() {
        this.loadBusinesses();
    }

    showProfile() {
        this.showAlert('Profile functionality coming soon!', 'info');
    }

    showSettings() {
        this.showAlert('Settings functionality coming soon!', 'info');
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', function() {
    dashboard = new BusinessDashboard();
});

// Global functions for onclick handlers
window.showAddBusinessModal = () => dashboard.showAddBusinessModal();
window.createBusiness = () => dashboard.createBusiness();
window.refreshBusinesses = () => dashboard.refreshBusinesses();
