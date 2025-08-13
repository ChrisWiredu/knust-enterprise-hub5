// Business Detail JavaScript

// Global cart object (shared across pages)
if (!window.cart) {
    window.cart = {
    items: [],
    addItem: function(product) {
        // Check if item already exists in cart
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.updateCart();
        this.showNotification(`${product.name} added to cart`);
    },
    removeItem: function(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.updateCart();
    },
    updateQuantity: function(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
            }
        }
        this.updateCart();
    },
    updateCart: function() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.items.length;
        }
        this.renderCartItems();
        localStorage.setItem('cart', JSON.stringify(this.items));
    },
    renderCartItems: function() {
        const cartItemsEl = document.querySelector('#cartItems');
        if (!cartItemsEl) return;
        
        if (this.items.length === 0) {
            cartItemsEl.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        let total = 0;
        
        this.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            html += `
                <div class="cart-item border-bottom pb-3 mb-3">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <img src="${item.image_url || item.image}" alt="${item.name}" class="img-fluid rounded" style="width: 60px; height: 60px; object-fit: cover;">
                        </div>
                        <div class="col-md-4">
                            <h6 class="mb-1">${item.name}</h6>
                            <small class="text-muted">${item.business_name || item.business}</small>
                        </div>
                        <div class="col-md-2 text-center">
                            <input type="number" value="${item.quantity}" min="1" class="form-control form-control-sm" 
                                   onchange="cart.updateQuantity(${item.id}, this.value)">
                        </div>
                        <div class="col-md-2 text-end">
                            <span class="fw-bold">GHS ${itemTotal.toFixed(2)}</span>
                        </div>
                        <div class="col-md-2 text-end">
                            <button class="btn btn-sm btn-link text-danger" onclick="cart.removeItem(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            <div class="text-end">
                <h5>Total: GHS ${total.toFixed(2)}</h5>
            </div>
        `;
        
        cartItemsEl.innerHTML = html;
    },
    showNotification: function(message) {
        const notification = document.createElement('div');
        notification.className = 'position-fixed bottom-0 end-0 m-3 alert alert-success alert-dismissible fade show';
        notification.style.zIndex = '1100';
        notification.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 150);
        }, 3000);
    },
    clear: function() {
        this.items = [];
        this.updateCart();
    },
    loadFromStorage: function() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.items = JSON.parse(savedCart);
            this.updateCart();
        }
    }
};
}

class BusinessDetail {
    constructor() {
        this.businessId = this.getBusinessIdFromUrl();
        this.business = null;
        this.products = [];
        this.services = [];
        this.reviews = [];
        this.init();
    }

    getBusinessIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || '1'; // Default to 1 for demo
    }

    async init() {
        if (!this.businessId) {
            this.showError('Business ID not found');
            return;
        }

        try {
            // Load cart from localStorage
            window.cart.loadFromStorage();
            
            await this.loadBusinessDetails();
            await this.loadProducts();
            await this.loadServices();
            await this.loadReviews();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing business detail:', error);
            this.showError('Failed to load business details');
        }
    }

    async loadBusinessDetails() {
        try {
            // For demo purposes, we'll use mock data
            // In production, this would be an API call
            this.business = this.getMockBusinessData();
            this.renderBusinessHeader();
        } catch (error) {
            console.error('Error loading business details:', error);
            throw error;
        }
    }

    getMockBusinessData() {
        const businesses = [
            {
                id: 1,
                name: "Los Barbados",
                description: "Authentic Caribbean cuisine with a modern twist. We serve the best jerk chicken, rice and peas, and tropical drinks in KNUST. Our food is prepared fresh daily using traditional recipes passed down through generations.",
                category: "Food & Drinks",
                location: "Unity Hall",
                contact_number: "+233 25 727 0471",
                whatsapp_link: "wa.me/233257270471",
                instagram_handle: "@losbarbados_knust",
                facebook_page: "Los Barbados KNUST",
                website_url: "https://losbarbados.com",
                operating_hours: "Mon-Fri: 8AM-10PM, Sat: 9AM-11PM, Sun: 10AM-9PM",
                logo_url: "img2/losb.jpg",
                banner_url: "img2/losb.jpg",
                owner_first_name: "Chris",
                owner_last_name: "Elliot",
                owner_username: "chris_elliot",
                average_rating: 4.5,
                total_reviews: 24,
                total_orders: 156,
                total_revenue: 12500.00,
                is_active: true,
                created_at: "2024-01-15",
                total_views: 1250,
                total_clicks: 890
            },
            {
                id: 2,
                name: "TechFix Pro",
                description: "Professional electronics repair and maintenance services. We specialize in laptop repairs, phone screen replacements, and general tech support. Fast, reliable, and affordable service for all KNUST students.",
                category: "Electronics",
                location: "Africa Hall",
                contact_number: "+233 24 123 4567",
                whatsapp_link: "wa.me/233241234567",
                instagram_handle: "@techfix_pro",
                facebook_page: "TechFix Pro KNUST",
                website_url: "",
                operating_hours: "Mon-Sat: 9AM-6PM",
                logo_url: "img2/AA.png",
                banner_url: "img2/AA.png",
                owner_first_name: "Sarah",
                owner_last_name: "Johnson",
                owner_username: "sarah_tech",
                average_rating: 4.8,
                total_reviews: 18,
                total_orders: 89,
                total_revenue: 8900.00,
                is_active: true,
                created_at: "2024-02-01",
                total_views: 980,
                total_clicks: 650
            },
            {
                id: 3,
                name: "Style Studio",
                description: "Fashion boutique offering trendy clothing, accessories, and styling services. We bring the latest fashion trends to KNUST campus with affordable prices and excellent customer service.",
                category: "Fashion",
                location: "Queen's Hall",
                contact_number: "+233 26 987 6543",
                whatsapp_link: "wa.me/233269876543",
                instagram_handle: "@style_studio_knust",
                facebook_page: "Style Studio KNUST",
                website_url: "",
                operating_hours: "Mon-Sat: 10AM-8PM, Sun: 12PM-6PM",
                logo_url: "img2/braid1.WEBP",
                banner_url: "img2/braid1.WEBP",
                owner_first_name: "Emma",
                owner_last_name: "Davis",
                owner_username: "emma_style",
                average_rating: 4.3,
                total_reviews: 31,
                total_orders: 203,
                total_revenue: 15600.00,
                is_active: true,
                created_at: "2023-11-20",
                total_views: 2100,
                total_clicks: 1450
            }
        ];

        return businesses.find(b => b.id == this.businessId) || businesses[0];
    }

    renderBusinessHeader() {
        if (!this.business) return;

        // Update page title
        document.title = `${this.business.name} - KNUST Enterprise Hub`;

        // Update business header with better styling
        const businessName = document.getElementById('businessName');
        businessName.textContent = this.business.name;
        businessName.className = 'mb-2 text-success fw-bold';

        const businessOwner = document.getElementById('businessOwner');
        businessOwner.textContent = `by ${this.business.owner_first_name} ${this.business.owner_last_name}`;
        businessOwner.className = 'text-muted mb-2';

        const businessCategory = document.getElementById('businessCategory');
        businessCategory.textContent = this.business.category;
        businessCategory.className = 'badge bg-success fs-6';

        const businessDescription = document.getElementById('businessDescription');
        businessDescription.textContent = this.business.description;
        businessDescription.className = 'lead text-dark';

        const businessLocation = document.getElementById('businessLocation');
        businessLocation.innerHTML = `<i class="fas fa-map-marker-alt me-1 text-warning"></i>${this.business.location}`;
        businessLocation.className = 'text-muted';

        // Update business image with better styling
        const businessImage = document.getElementById('businessImage');
        if (businessImage) {
            businessImage.src = this.business.logo_url || 'img2/losb.jpg';
            businessImage.alt = this.business.name;
            businessImage.className = 'img-fluid rounded-lg shadow';
        }

        // Update rating with better colors
        this.updateRatingDisplay(this.business.average_rating, this.business.total_reviews);

        // Update stats with better styling
        const totalOrders = document.getElementById('totalOrders');
        totalOrders.textContent = this.business.total_orders;
        totalOrders.className = 'mb-1 text-success fw-bold';

        const totalReviews = document.getElementById('totalReviews');
        totalReviews.textContent = this.business.total_reviews;
        totalReviews.className = 'mb-1 text-info fw-bold';
        
        // Calculate business age
        const createdDate = new Date(this.business.created_at);
        const today = new Date();
        const daysActive = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
        const businessAge = document.getElementById('businessAge');
        businessAge.textContent = daysActive;
        businessAge.className = 'mb-1 text-warning fw-bold';

        // Update about section
        this.updateAboutSection();
    }

    updateRatingDisplay(rating, reviewCount) {
        const ratingElements = document.querySelectorAll('#businessRating, #averageRatingStars');
        
        ratingElements.forEach(element => {
            const stars = element.querySelectorAll('i');
            stars.forEach((star, index) => {
                if (index < Math.floor(rating)) {
                    star.className = 'fas fa-star';
                } else if (index === Math.floor(rating) && rating % 1 > 0) {
                    star.className = 'fas fa-star-half-alt';
                } else {
                    star.className = 'far fa-star';
                }
            });
        });

        // Update rating text
        const ratingTexts = document.querySelectorAll('#businessRating span, #averageRating');
        ratingTexts.forEach(element => {
            if (element.id === 'averageRating') {
                element.textContent = rating.toFixed(1);
            } else {
                element.textContent = `(${reviewCount})`;
            }
        });

        // Update total reviews count
        const totalReviewsCount = document.getElementById('totalReviewsCount');
        if (totalReviewsCount) {
            totalReviewsCount.textContent = `${reviewCount} reviews`;
        }
    }

    updateAboutSection() {
        document.getElementById('businessAboutDescription').textContent = this.business.description;
        document.getElementById('aboutCategory').textContent = this.business.category;
        document.getElementById('aboutLocation').textContent = this.business.location;
        document.getElementById('aboutContact').textContent = this.business.contact_number;
        document.getElementById('aboutEstablished').textContent = new Date(this.business.created_at).toLocaleDateString();
        document.getElementById('aboutHours').textContent = this.business.operating_hours;
        document.getElementById('aboutStatus').textContent = this.business.is_active ? 'Active' : 'Inactive';
    }

    async loadProducts() {
        try {
            // Mock products data
            this.products = this.getMockProductsData();
            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    getMockProductsData() {
        const productsByBusiness = {
            1: [ // Los Barbados
                {
                    id: 1,
                    name: "Jerk Chicken",
                    description: "Authentic Jamaican jerk chicken with rice and peas",
                    price: 25.00,
                    original_price: 30.00,
                    category: "Main Course",
                    image_url: "img2/losb.jpg",
                    is_available: true,
                    stock_quantity: 50,
                    unit: "plate"
                },
                {
                    id: 2,
                    name: "Tropical Smoothie",
                    description: "Fresh fruit smoothie with mango, pineapple, and coconut",
                    price: 12.00,
                    original_price: 15.00,
                    category: "Beverage",
                    image_url: "img2/losb.jpg",
                    is_available: true,
                    stock_quantity: 30,
                    unit: "glass"
                },
                {
                    id: 3,
                    name: "Plantain Chips",
                    description: "Crispy fried plantain chips with special seasoning",
                    price: 8.00,
                    original_price: 10.00,
                    category: "Snack",
                    image_url: "img2/losb.jpg",
                    is_available: true,
                    stock_quantity: 100,
                    unit: "pack"
                }
            ],
            2: [ // TechFix Pro
                {
                    id: 4,
                    name: "Laptop Screen Replacement",
                    description: "Professional laptop screen replacement service",
                    price: 150.00,
                    original_price: 200.00,
                    category: "Repair",
                    image_url: "img2/AA.png",
                    is_available: true,
                    stock_quantity: 0,
                    unit: "service"
                },
                {
                    id: 5,
                    name: "Phone Screen Repair",
                    description: "Fast phone screen repair with warranty",
                    price: 80.00,
                    original_price: 100.00,
                    category: "Repair",
                    image_url: "img2/AA.png",
                    is_available: true,
                    stock_quantity: 0,
                    unit: "service"
                }
            ],
            3: [ // Style Studio
                {
                    id: 6,
                    name: "Summer Dress Collection",
                    description: "Trendy summer dresses in various colors and sizes",
                    price: 45.00,
                    original_price: 60.00,
                    category: "Clothing",
                    image_url: "img2/braid1.WEBP",
                    is_available: true,
                    stock_quantity: 25,
                    unit: "piece"
                },
                {
                    id: 7,
                    name: "Styling Consultation",
                    description: "Personal styling consultation and outfit planning",
                    price: 30.00,
                    original_price: 40.00,
                    category: "Service",
                    image_url: "img2/braid1.WEBP",
                    is_available: true,
                    stock_quantity: 0,
                    unit: "session"
                }
            ]
        };

        return productsByBusiness[this.businessId] || [];
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        
        if (this.products.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No products available</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = this.products.map(product => {
            // Check if this is a service (has unit "service" or is in repair category)
            const isService = product.unit === "service" || product.category.toLowerCase().includes("repair");
            
            return `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="card h-100 product-card shadow-sm">
                        <img src="${product.image_url}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-dark">${product.name}</h5>
                            <p class="card-text text-muted">${product.description}</p>
                            <div class="mt-auto">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <span class="h5 text-success mb-0">GHS ${product.price.toFixed(2)}</span>
                                        ${product.original_price > product.price ? 
                                            `<small class="text-muted text-decoration-line-through ms-2">GHS ${product.original_price.toFixed(2)}</small>` : 
                                            ''
                                        }
                                    </div>
                                    <span class="badge ${isService ? 'bg-warning text-dark' : 'bg-primary'}">${product.category}</span>
                                </div>
                                <div class="d-grid gap-2">
                                    ${isService ? `
                                        <button class="btn btn-warning text-dark" onclick="businessDetail.contactAboutProduct(${product.id})">
                                            <i class="fas fa-phone me-2"></i>Contact Business
                                        </button>
                                    ` : `
                                        <button class="btn btn-success" onclick="businessDetail.addToCart(${product.id})">
                                            <i class="fas fa-shopping-cart me-2"></i>Add to Cart
                                        </button>
                                    `}
                                    <button class="btn btn-outline-info" onclick="businessDetail.contactAboutProduct(${product.id})">
                                        <i class="fas fa-info-circle me-2"></i>Ask About This
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadServices() {
        try {
            // Mock services data
            this.services = this.getMockServicesData();
            this.renderServices();
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    getMockServicesData() {
        const servicesByBusiness = {
            1: [ // Los Barbados
                {
                    id: 1,
                    name: "Catering Service",
                    description: "Professional catering for events and parties",
                    price: 500.00,
                    duration: "Per event",
                    category: "Catering",
                    image_url: "img2/losb.jpg",
                    is_available: true
                },
                {
                    id: 2,
                    name: "Cooking Classes",
                    description: "Learn to cook Caribbean dishes",
                    price: 100.00,
                    duration: "2 hours",
                    category: "Education",
                    image_url: "img2/losb.jpg",
                    is_available: true
                }
            ],
            2: [ // TechFix Pro
                {
                    id: 3,
                    name: "Virus Removal",
                    description: "Complete virus removal and system optimization",
                    price: 50.00,
                    duration: "1-2 hours",
                    category: "Software",
                    image_url: "img2/AA.png",
                    is_available: true
                },
                {
                    id: 4,
                    name: "Data Recovery",
                    description: "Professional data recovery services",
                    price: 120.00,
                    duration: "24-48 hours",
                    category: "Data",
                    image_url: "img2/AA.png",
                    is_available: true
                }
            ],
            3: [ // Style Studio
                {
                    id: 5,
                    name: "Personal Styling",
                    description: "Complete personal styling and wardrobe consultation",
                    price: 80.00,
                    duration: "1 hour",
                    category: "Consultation",
                    image_url: "img2/braid1.WEBP",
                    is_available: true
                }
            ]
        };

        return servicesByBusiness[this.businessId] || [];
    }

    renderServices() {
        const servicesGrid = document.getElementById('servicesGrid');
        
        if (this.services.length === 0) {
            servicesGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-tools fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No services available</p>
                </div>
            `;
            return;
        }

        servicesGrid.innerHTML = this.services.map(service => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 service-card shadow-sm">
                    <img src="${service.image_url}" class="card-img-top" alt="${service.name}" style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title text-dark">${service.name}</h5>
                        <p class="card-text text-muted">${service.description}</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <span class="h5 text-warning mb-0">GHS ${service.price.toFixed(2)}</span>
                                    <small class="text-muted d-block">${service.duration}</small>
                                </div>
                                <span class="badge bg-warning text-dark">${service.category}</span>
                            </div>
                            <div class="d-grid gap-2">
                                <button class="btn btn-warning text-dark" onclick="businessDetail.contactAboutService(${service.id})">
                                    <i class="fas fa-phone me-2"></i>Contact Business
                                </button>
                                <button class="btn btn-outline-info" onclick="businessDetail.contactAboutService(${service.id})">
                                    <i class="fas fa-info-circle me-2"></i>Ask About This
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadReviews() {
        try {
            // Mock reviews data
            this.reviews = this.getMockReviewsData();
            this.renderReviews();
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    getMockReviewsData() {
        return [
            {
                id: 1,
                rating: 5,
                comment: "Amazing food! The jerk chicken is absolutely delicious. Great service and reasonable prices.",
                user_first_name: "John",
                user_last_name: "Doe",
                user_username: "john_doe",
                created_at: "2024-01-20",
                is_verified_purchase: true
            },
            {
                id: 2,
                rating: 4,
                comment: "Good quality food and fast delivery. Will definitely order again!",
                user_first_name: "Jane",
                user_last_name: "Smith",
                user_username: "jane_smith",
                created_at: "2024-01-18",
                is_verified_purchase: true
            },
            {
                id: 3,
                rating: 5,
                comment: "Best Caribbean food on campus! The staff is friendly and the portions are generous.",
                user_first_name: "Mike",
                user_last_name: "Johnson",
                user_username: "mike_j",
                created_at: "2024-01-15",
                is_verified_purchase: false
            }
        ];
    }

    renderReviews() {
        const reviewsList = document.getElementById('reviewsList');
        
        if (this.reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-star fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No reviews yet</p>
                    <button class="btn btn-primary" onclick="showWriteReviewModal()">
                        <i class="fas fa-edit me-2"></i>Write the First Review
                    </button>
                </div>
            `;
            return;
        }

        reviewsList.innerHTML = this.reviews.map(review => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1">${review.user_first_name} ${review.user_last_name}</h6>
                            <div class="rating-star">
                                ${this.generateStarRating(review.rating)}
                            </div>
                        </div>
                        <div class="text-end">
                            <small class="text-muted">${new Date(review.created_at).toLocaleDateString()}</small>
                            ${review.is_verified_purchase ? 
                                '<br><span class="badge bg-success badge-sm">Verified Purchase</span>' : 
                                ''
                            }
                        </div>
                    </div>
                    <p class="card-text">${review.comment}</p>
                </div>
            </div>
        `).join('');
    }

    generateStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star text-warning"></i>';
            } else {
                stars += '<i class="far fa-star text-warning"></i>';
            }
        }
        return stars;
    }

    setupEventListeners() {
        // Rating input functionality
        const ratingStars = document.querySelectorAll('.rating-input i');
        ratingStars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });
        });
    }

    setRating(rating) {
        const stars = document.querySelectorAll('.rating-input i');
        const selectedRatingInput = document.getElementById('selectedRating');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.className = 'fas fa-star fa-2x text-warning';
            } else {
                star.className = 'far fa-star fa-2x text-warning';
            }
        });
        
        selectedRatingInput.value = rating;
    }

    // Contact functions
    contactViaWhatsApp() {
        if (this.business.whatsapp_link) {
            window.open(`https://${this.business.whatsapp_link}`, '_blank');
        } else {
            this.showAlert('WhatsApp link not available', 'warning');
        }
    }

    contactViaInstagram() {
        if (this.business.instagram_handle) {
            window.open(`https://instagram.com/${this.business.instagram_handle.replace('@', '')}`, '_blank');
        } else {
            this.showAlert('Instagram handle not available', 'warning');
        }
    }

    contactViaPhone() {
        if (this.business.contact_number) {
            window.open(`tel:${this.business.contact_number}`, '_blank');
        } else {
            this.showAlert('Phone number not available', 'warning');
        }
    }

    contactViaEmail() {
        if (this.business.owner_email) {
            window.open(`mailto:${this.business.owner_email}`, '_blank');
        } else {
            this.showAlert('Email not available', 'warning');
        }
    }

    // Cart functions
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            // Add business name to the product for cart display
            const productWithBusiness = {
                ...product,
                business_name: this.business.name
            };
            window.cart.addItem(productWithBusiness);
        }
    }

    bookService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            this.showAlert(`Service "${service.name}" booking request sent!`, 'success');
            // In a real app, this would open a booking form
        }
    }

    contactAboutProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.contactViaWhatsApp();
        }
    }

    contactAboutService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            this.contactViaWhatsApp();
        }
    }

    showWriteReviewModal() {
        const modal = new bootstrap.Modal(document.getElementById('writeReviewModal'));
        modal.show();
    }

    submitReview() {
        const rating = document.getElementById('selectedRating').value;
        const comment = document.getElementById('reviewComment').value;

        if (!rating || rating == 0) {
            this.showAlert('Please select a rating', 'warning');
            return;
        }

        if (!comment.trim()) {
            this.showAlert('Please write a review comment', 'warning');
            return;
        }

        // In a real app, this would submit to the backend
        this.showAlert('Review submitted successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('writeReviewModal')).hide();
        
        // Reset form
        document.getElementById('reviewForm').reset();
        this.setRating(0);
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

    showError(message) {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h3>Error</h3>
                <p class="text-muted">${message}</p>
                <a href="index.html" class="btn btn-primary">Go Back Home</a>
            </div>
        `;
    }

    proceedToCheckout() {
        if (!window.cart || window.cart.items.length === 0) {
            this.showAlert('Your cart is empty. Please add some items before proceeding to checkout.', 'warning');
            return;
        }
        
        // Close the cart modal
        const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        if (cartModal) {
            cartModal.hide();
        }
        
        // Navigate to checkout page
        window.location.href = '/checkout';
    }
}

// Initialize business detail when DOM is loaded
let businessDetail;
document.addEventListener('DOMContentLoaded', function() {
    businessDetail = new BusinessDetail();
});

// Global functions for onclick handlers
window.showWriteReviewModal = () => businessDetail.showWriteReviewModal();
window.submitReview = () => businessDetail.submitReview();
window.contactViaWhatsApp = () => businessDetail.contactViaWhatsApp();
window.contactViaInstagram = () => businessDetail.contactViaInstagram();
window.contactViaPhone = () => businessDetail.contactViaPhone();
window.contactViaEmail = () => businessDetail.contactViaEmail();
window.proceedToCheckout = () => businessDetail.proceedToCheckout();
