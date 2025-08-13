// Navigation Functions
window.showRegisterBusinessModal = function(event) {
    event.preventDefault();
    console.log('Register Business clicked!');
    
    // Check if user is authenticated first
    const auth = window.authManager;
    if (auth && !auth.currentUser) {
        showAlert('Please log in to register a business.', 'warning');
        // Show login dropdown or redirect to login
        const authNavLink = document.getElementById('authNavLink');
        if (authNavLink) {
            authNavLink.click();
        }
        return;
    }
    
    // Scroll to the register business section
    const registerSection = document.querySelector('#register-business');
    if (registerSection) {
        // First make the section visible
        registerSection.style.display = 'block';
        
        // Hide other sections
        const businessList = document.querySelector('#business-list');
        const businessDetail = document.querySelector('#business-detail');
        if (businessList) businessList.style.display = 'none';
        if (businessDetail) businessDetail.style.display = 'none';
        
        // Scroll to the section
        registerSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    } else {
        // If section doesn't exist, show the modal
        const registerModal = document.querySelector('#businessRegistrationModal');
        if (registerModal) {
            const modal = new bootstrap.Modal(registerModal);
            modal.show();
        } else {
            showAlert('Register business feature will be available soon!', 'info');
        }
    }
};

window.scrollToCategories = function(event) {
    event.preventDefault();
    console.log('Categories clicked!');
    
    // Try multiple selectors to find categories section
    const selectors = [
        '[id*="categories"]',
        '.categories',
        '[class*="category"]',
        '#categories'
    ];
    
    let categoriesSection = null;
    for (const selector of selectors) {
        try {
            categoriesSection = document.querySelector(selector);
            if (categoriesSection) break;
        } catch (e) {
            // Skip invalid selectors
            continue;
        }
    }
    
    if (categoriesSection) {
        categoriesSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    } else {
        // Fallback: find any element with "Categories" text
        const categoryHeaders = document.querySelectorAll('h2, h3, h4, h5, h6');
        let found = false;
        categoryHeaders.forEach(header => {
            if (header.textContent.toLowerCase().includes('categories')) {
                header.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                found = true;
                return; // Exit forEach when found
            }
        });
        
        if (!found) {
            // Try to find any section that might contain categories
            const sections = document.querySelectorAll('section');
            sections.forEach(section => {
                if (section.textContent.toLowerCase().includes('categories')) {
                    section.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                    found = true;
                    return; // Exit forEach when found
                }
            });
        }
        
        if (!found) {
            showAlert('Categories section not found. Please scroll down to view categories.', 'info');
        }
    }
};

// Add missing functions
window.goBackToHome = function(event) {
    event.preventDefault();
    console.log('Going back to home...');
    
    // Show business list section
    const businessList = document.querySelector('#business-list');
    const registerSection = document.querySelector('#register-business');
    const businessDetail = document.querySelector('#business-detail');
    
    if (businessList) businessList.style.display = 'block';
    if (registerSection) registerSection.style.display = 'none';
    if (businessDetail) businessDetail.style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
    });
};

window.viewBusiness = function(businessId) {
    console.log('Viewing business:', businessId);
    // Navigate to business detail page
    window.location.href = `business-detail.html?id=${businessId}`;
};

// Make functions available globally
window.addEventListener('DOMContentLoaded', function() {
    console.log('Navigation functions loaded!');
});
