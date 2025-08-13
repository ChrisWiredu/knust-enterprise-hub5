// Authentication management for KNUST Enterprise Hub

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Check if user is logged in from localStorage
        const savedUser = localStorage.getItem('knust_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.isAuthenticated = true;
                this.updateUI();
            } catch (e) {
                console.error('Error parsing saved user:', e);
                this.logout();
            }
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login link
        const loginLink = document.getElementById('loginLink');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // Register link
        const registerLink = document.getElementById('registerLink');
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }
    }

    login(email, password) {
        // Simulate login API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Mock validation - in real app, this would be an API call
                if (email && password) {
                    this.currentUser = {
                        id: 1,
                        email: email,
                        name: email.split('@')[0],
                        indexNumber: '8571321',
                        hall: 'Unity Hall',
                        department: 'Computer Science',
                        phone: '257270471'
                    };
                    this.isAuthenticated = true;
                    
                    // Save to localStorage
                    localStorage.setItem('knust_user', JSON.stringify(this.currentUser));
                    
                    this.updateUI();
                    resolve(this.currentUser);
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 1000);
        });
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('knust_user');
        this.updateUI();
        
        // Show logout message
        this.showAlert('You have been logged out successfully.', 'info');
    }

    updateUI() {
        const authNavLink = document.getElementById('authNavLink');
        const authNavText = document.getElementById('authNavText');
        const authDropdownMenu = document.getElementById('authDropdownMenu');

        if (this.isAuthenticated && this.currentUser) {
            // Update auth nav text
            if (authNavText) {
                authNavText.textContent = this.currentUser.name;
            }

            // Show dashboard link for business owners
            const dashboardLink = document.getElementById('dashboardLink');
            if (dashboardLink && this.currentUser.account_type === 'business_owner') {
                dashboardLink.style.display = 'block';
            }

            // Update dropdown menu
            if (authDropdownMenu) {
                authDropdownMenu.innerHTML = `
                    <li><a class="dropdown-item" href="#" onclick="authManager.showProfile()">
                        <i class="fas fa-user me-2"></i> Profile
                    </a></li>
                    ${this.currentUser.account_type === 'business_owner' ? `
                    <li><a class="dropdown-item" href="business-dashboard.html">
                        <i class="fas fa-chart-line me-2"></i> Business Dashboard
                    </a></li>
                    ` : ''}
                    <li><a class="dropdown-item" href="#" onclick="authManager.showSettings()">
                        <i class="fas fa-cog me-2"></i> Settings
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="authManager.logout()">
                        <i class="fas fa-sign-out-alt me-2"></i> Logout
                    </a></li>
                `;
            }
        } else {
            // Reset to default state
            if (authNavText) {
                authNavText.textContent = 'Sign in / Register';
            }

            if (authDropdownMenu) {
                authDropdownMenu.innerHTML = `
                    <li><a class="dropdown-item" href="#" id="loginLink">
                        <i class="fas fa-sign-in-alt me-2"></i> Login
                    </a></li>
                    <li><a class="dropdown-item" href="#" id="registerLink">
                        <i class="fas fa-user-plus me-2"></i> Register
                    </a></li>
                `;
                
                // Re-attach event listeners
                this.setupEventListeners();
            }
        }
    }

    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'loginModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Login</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="loginEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="loginEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="loginPassword" class="form-label">Password</label>
                                <input type="password" class="form-control" id="loginPassword" required>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">Login</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Handle form submission
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Logging in...';
            
            try {
                await this.login(email, password);
                bootstrapModal.hide();
                this.showAlert('Login successful!', 'success');
            } catch (error) {
                this.showAlert('Login failed. Please check your credentials.', 'danger');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Login';
            }
        });

        // Clean up modal when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    showRegisterModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'registerModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Register</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="registerForm">
                            <div class="mb-3">
                                <label for="registerEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="registerEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="registerPassword" class="form-label">Password</label>
                                <input type="password" class="form-control" id="registerPassword" required>
                            </div>
                            <div class="mb-3">
                                <label for="registerConfirmPassword" class="form-label">Confirm Password</label>
                                <input type="password" class="form-control" id="registerConfirmPassword" required>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Handle form submission
        const registerForm = document.getElementById('registerForm');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            
            if (password !== confirmPassword) {
                this.showAlert('Passwords do not match.', 'danger');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Registering...';
            
            try {
                // Simulate registration
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.login(email, password); // Auto-login after registration
                bootstrapModal.hide();
                this.showAlert('Registration successful! You are now logged in.', 'success');
            } catch (error) {
                this.showAlert('Registration failed. Please try again.', 'danger');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Register';
            }
        });

        // Clean up modal when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    showProfile() {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            const modal = new bootstrap.Modal(profileModal);
            modal.show();
        }
    }

    showSettings() {
        this.showAlert('Settings feature coming soon!', 'info');
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
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.isAuthenticated;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.authManager = new AuthManager();
});

// Export for global use
window.AuthManager = AuthManager;
