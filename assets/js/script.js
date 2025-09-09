/**
 * TravelBook - Main JavaScript File
 * Handles all interactive functionality for the travel agency landing page
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all functionality
    initSmoothScrolling();
    initNavigationScroll();
    initPackageCards();
    initMobileMenu();
    initFormHandling();
    initAnimations();
    initLazyLoading();
    
    // Delay Upstash integration to ensure all scripts are loaded
    setTimeout(() => {
        initUpstashIntegration();
        initCurrencyConversion();
    }, 100);
    
});

/**
 * Smooth scrolling for navigation links
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Navigation scroll effect
 */
function initNavigationScroll() {
    const nav = document.querySelector('nav');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            nav.classList.add('nav-scroll');
        } else {
            nav.classList.remove('nav-scroll');
        }
    });
}

/**
 * Package card interactions
 */
function initPackageCards() {
    const packageCards = document.querySelectorAll('.package-card, .bg-white.rounded-xl.shadow-lg');
    
    packageCards.forEach(card => {
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        // Add click tracking for analytics
        const bookButton = card.querySelector('button');
        if (bookButton) {
            bookButton.addEventListener('click', function(e) {
                e.preventDefault();
                const packageName = card.querySelector('h3').textContent;
                trackPackageClick(packageName);
                showBookingModal(packageName);
            });
        }
    });
}

/**
 * Mobile menu functionality
 */
function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.md\\:hidden button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            // Toggle mobile menu
            if (mobileMenu) {
                mobileMenu.classList.toggle('active');
            } else {
                // Create mobile menu if it doesn't exist
                createMobileMenu();
            }
        });
    }
}

/**
 * Create mobile menu dynamically
 */
function createMobileMenu() {
    const nav = document.querySelector('nav');
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out';
    
    mobileMenu.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-xl font-bold text-primary-600">TravelBook</h2>
                <button class="close-mobile-menu text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <nav class="space-y-4">
                <a href="#home" class="block text-gray-900 hover:text-primary-600 py-2">Home</a>
                <a href="#packages" class="block text-gray-500 hover:text-primary-600 py-2">Packages</a>
                <a href="#about" class="block text-gray-500 hover:text-primary-600 py-2">About</a>
                <a href="#contact" class="block text-gray-500 hover:text-primary-600 py-2">Contact</a>
            </nav>
        </div>
    `;
    
    document.body.appendChild(mobileMenu);
    
    // Add close functionality
    const closeButton = mobileMenu.querySelector('.close-mobile-menu');
    closeButton.addEventListener('click', function() {
        mobileMenu.classList.remove('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target) && !mobileMenu.contains(e.target)) {
            mobileMenu.classList.remove('active');
        }
    });
}

/**
 * Form handling and validation
 */
function initFormHandling() {
    // Handle contact form if it exists
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission(this);
        });
    }
    
    // Handle newsletter signup if it exists
    const newsletterForm = document.querySelector('#newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleNewsletterSignup(this);
        });
    }
}

/**
 * Handle contact form submission
 */
function handleFormSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (!data.name || !data.email || !data.message) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    // Simulate form submission
    showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
    form.reset();
}

/**
 * Handle newsletter signup
 */
function handleNewsletterSignup(form) {
    const email = form.querySelector('input[type="email"]').value;
    
    if (!email) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    showNotification('Thank you for subscribing to our newsletter!', 'success');
    form.reset();
}

/**
 * Show notification messages
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${colors[type]}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <span>${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

/**
 * Track package clicks for analytics
 */
function trackPackageClick(packageName) {
    // In a real application, you would send this data to your analytics service
    console.log(`Package clicked: ${packageName}`);
    
    // Example: Google Analytics event tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'package_click', {
            'package_name': packageName,
            'event_category': 'engagement',
            'event_label': 'package_interaction'
        });
    }
}

/**
 * Show booking modal
 */
function showBookingModal(packageName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 opacity-0">
            <div class="text-center">
                <h3 class="text-2xl font-bold mb-4">Book ${packageName}</h3>
                <p class="text-gray-600 mb-6">Ready to start your adventure? Contact us to book this amazing package!</p>
                <div class="space-y-3">
                    <button class="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg transition-colors">
                        <i class="fas fa-phone mr-2"></i>Call Now: (+639)555-143-738
                    </button>
                    <button class="w-full border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white py-3 px-6 rounded-lg transition-colors">
                        <i class="fas fa-envelope mr-2"></i>Email Us
                    </button>
                    <button class="w-full text-gray-500 hover:text-gray-700 py-2" onclick="this.closest('.fixed').remove()">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => {
        const modalContent = modal.querySelector('.bg-white');
        modalContent.classList.remove('scale-95', 'opacity-0');
    }, 100);
    
    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Initialize scroll animations
 */
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.package-card, .testimonial-card, .feature-icon');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('image-loading');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * Utility function to debounce function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Handle window resize events
 */
window.addEventListener('resize', debounce(function() {
    // Close mobile menu on resize to desktop
    const mobileMenu = document.querySelector('.mobile-menu');
    if (window.innerWidth >= 768 && mobileMenu) {
        mobileMenu.classList.remove('active');
    }
}, 250));

/**
 * Add loading states to buttons
 */
function addLoadingState(button, text = 'Loading...') {
    const originalText = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${text}`;
    button.disabled = true;
    
    return function removeLoadingState() {
        button.innerHTML = originalText;
        button.disabled = false;
    };
}

/**
 * Format currency for display
 */
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Validate email address
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Get current year for footer
 */
function updateFooterYear() {
    const yearElement = document.querySelector('#current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Initialize footer year on load
document.addEventListener('DOMContentLoaded', updateFooterYear);

/**
 * Initialize Upstash integration
 */
async function initUpstashIntegration() {
    try {
        // Check if Upstash is configured
        if (!window.UPSTASH_CONFIG || !window.UPSTASH_CONFIG.apiBase) {
            return;
        }
        
        // Test connection
        const isConnected = await testUpstashConnection();
        if (!isConnected) {
            return;
        }
        
        // Load packages from Upstash
        await loadPackagesFromUpstash();
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Test Upstash connection
 */
async function testUpstashConnection() {
    try {
        // Simple test using keys command
        await upstashRequest('keys', ['*']);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Load packages from Upstash and update the page
 */
async function loadPackagesFromUpstash() {
    try {
        // Check if package manager is available
        if (!window.packageManager) {
            return;
        }
        
        const result = await window.packageManager.getAllPackages(true);
        
        if (result.success && result.packages && result.packages.length > 0) {
            // Replace static packages with dynamic ones
            updatePackagesDisplay(result.packages);
        }
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Update packages display with dynamic data
 */
function updatePackagesDisplay(packages) {
    const packagesContainer = document.querySelector('#packages-container');
    if (!packagesContainer) return;
    
    // Clear existing packages
    packagesContainer.innerHTML = '';
    
    if (packages.length === 0) {
        // Show no packages message
        packagesContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i class="fas fa-box-open text-gray-400 text-2xl"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No Packages Available</h3>
                <p class="text-gray-500 mb-4">No travel packages have been added yet.</p>
                <a href="admin.html" class="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <i class="fas fa-plus mr-2"></i>Add Your First Package
                </a>
            </div>
        `;
        return;
    }
    
    // Create package cards
    packages.forEach(packageData => {
        const packageCard = createPackageCard(packageData);
        packagesContainer.appendChild(packageCard);
    });
    
    // Re-initialize package card interactions
    initPackageCards();
    
    // Convert prices to user's preferred currency
    const savedCurrency = localStorage.getItem('preferred-currency') || 'USD';
    setTimeout(() => {
        convertAllPackagePrices(savedCurrency);
    }, 500);
}

/**
 * Create a package card element
 */
function createPackageCard(packageData) {
    const card = document.createElement('div');
    card.className = 'package-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300';
    
    const badgeHtml = packageData.badge ? 
        `<div class="package-badge absolute top-4 right-4 ${packageData.badge_color} text-white px-3 py-1 rounded-full text-sm font-semibold">
            ${packageData.badge}
        </div>` : '';
    
    const ratingStars = generateStarRating(packageData.rating);
    
    card.innerHTML = `
        <div class="relative">
            <img src="${packageData.image_url}" 
                 alt="${packageData.title}" 
                 class="w-full h-48 object-cover"
                 loading="lazy">
            ${badgeHtml}
        </div>
        <div class="p-6">
            <h3 class="text-xl font-bold mb-2">${packageData.title}</h3>
            <div class="text-gray-600 mb-4 whitespace-pre-line">${formatDescription(packageData.description)}</div>
            <div class="flex items-center mb-4">
                ${ratingStars}
                <span class="ml-2 text-gray-600">(${packageData.rating}/5)</span>
            </div>
            <div class="flex justify-between items-center">
                <div>
                    <span class="text-2xl font-bold text-primary-600 package-price" 
                          data-original-price="${packageData.price}" 
                          data-original-currency="${packageData.currency}">
                        ${window.currencyConverter.formatCurrency(packageData.price, packageData.currency)}
                    </span>
                    <span class="text-gray-500 package-currency">/${packageData.currency}</span>
                </div>
                <button class="btn-primary bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors" 
                        data-package-id="${packageData.id}">
                    Book Now
                </button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Format description with proper line breaks after emojis
 */
function formatDescription(description) {
    if (!description) return '';
    
    // Split the description by emojis and add line breaks
    // This regex matches common emoji patterns
    const emojiRegex = /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu;
    
    return description
        .split(emojiRegex)
        .map((part, index, array) => {
            // If this part is an emoji and there's text after it
            if (emojiRegex.test(part) && index < array.length - 1 && array[index + 1].trim()) {
                return part + '\n';
            }
            return part;
        })
        .join('')
        .trim();
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return `<div class="flex text-yellow-400">${starsHtml}</div>`;
}

/**
 * Currency Conversion Service
 */
class CurrencyConverter {
    constructor() {
        this.exchangeRates = {};
        this.baseCurrency = 'USD';
        this.lastUpdated = null;
        this.cacheDuration = 60 * 60 * 1000; // 1 hour
    }

    /**
     * Get exchange rates from API
     */
    async getExchangeRates() {
        try {
            // Check if we have cached rates that are still valid
            if (this.exchangeRates.USD && this.lastUpdated && 
                (Date.now() - this.lastUpdated) < this.cacheDuration) {
                return this.exchangeRates;
            }

            // Use a free exchange rate API
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            
            const data = await response.json();
            this.exchangeRates = data.rates;
            this.lastUpdated = Date.now();
            
            return this.exchangeRates;
        } catch (error) {
            // Fallback to static rates if API fails
            return this.getFallbackRates();
        }
    }

    /**
     * Fallback exchange rates (approximate)
     */
    getFallbackRates() {
        return {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            CAD: 1.25,
            PHP: 55.5,
            JPY: 110,
            AUD: 1.35,
            SGD: 1.35
        };
    }

    /**
     * Convert amount from one currency to another
     */
    async convert(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        const rates = await this.getExchangeRates();
        
        // Convert to USD first, then to target currency
        const usdAmount = amount / (rates[fromCurrency] || 1);
        const convertedAmount = usdAmount * (rates[toCurrency] || 1);
        
        return Math.round(convertedAmount * 100) / 100;
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount, currency) {
        const symbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            CAD: 'C$',
            PHP: '₱',
            JPY: '¥',
            AUD: 'A$',
            SGD: 'S$'
        };

        const symbol = symbols[currency] || currency;
        
        if (currency === 'JPY') {
            return `${symbol}${Math.round(amount).toLocaleString()}`;
        }
        
        return `${symbol}${amount.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    }
}

// Global currency converter instance
window.currencyConverter = new CurrencyConverter();

/**
 * Initialize currency conversion
 */
async function initCurrencyConversion() {
    try {
        const statusElement = document.getElementById('conversion-status');
        const selector = document.getElementById('currency-selector');
        
        if (!statusElement || !selector) return;

        // Load exchange rates
        await window.currencyConverter.getExchangeRates();
        
        // Update status
        statusElement.innerHTML = '<i class="fas fa-check text-green-500"></i> Rates loaded';
        
        // Add event listener for currency changes
        selector.addEventListener('change', async (e) => {
            const selectedCurrency = e.target.value;
            await convertAllPackagePrices(selectedCurrency);
        });

        // Set default currency based on user's location or preference
        const savedCurrency = localStorage.getItem('preferred-currency') || 'USD';
        selector.value = savedCurrency;
        
        // Convert prices to default currency
        await convertAllPackagePrices(savedCurrency);
        
    } catch (error) {
        const statusElement = document.getElementById('conversion-status');
        if (statusElement) {
            statusElement.innerHTML = '<i class="fas fa-exclamation-triangle text-yellow-500"></i> Using fallback rates';
        }
    }
}

/**
 * Convert all package prices to selected currency
 */
async function convertAllPackagePrices(targetCurrency) {
    try {
        const packageCards = document.querySelectorAll('.package-card');
        
        for (const card of packageCards) {
            const priceElement = card.querySelector('.package-price');
            const currencyElement = card.querySelector('.package-currency');
            
            if (priceElement && currencyElement) {
                const originalPrice = parseFloat(priceElement.dataset.originalPrice);
                const originalCurrency = priceElement.dataset.originalCurrency;
                
                if (originalPrice && originalCurrency) {
                    const convertedPrice = await window.currencyConverter.convert(
                        originalPrice, 
                        originalCurrency, 
                        targetCurrency
                    );
                    
                    const formattedPrice = window.currencyConverter.formatCurrency(convertedPrice, targetCurrency);
                    priceElement.textContent = formattedPrice;
                    currencyElement.textContent = `/${targetCurrency}`;
                }
            }
        }
        
        // Save user's preference
        localStorage.setItem('preferred-currency', targetCurrency);
        
    } catch (error) {
        // Silent error handling for production
    }
}

/**
 * Add package management functions to global scope
 */
window.addPackage = async function(packageData) {
    try {
        const result = await window.packageManager.createPackage(packageData);
        if (result.success) {
            showNotification('Package added successfully!', 'success');
            await loadPackagesFromUpstash(); // Refresh display
        } else {
            showNotification('Error adding package: ' + result.message, 'error');
        }
        return result;
    } catch (error) {
        showNotification('Error adding package: ' + error.message, 'error');
        return { success: false, message: error.message };
    }
};

window.updatePackage = async function(packageId, packageData) {
    try {
        const result = await window.packageManager.updatePackage(packageId, packageData);
        if (result.success) {
            showNotification('Package updated successfully!', 'success');
            await loadPackagesFromUpstash(); // Refresh display
        } else {
            showNotification('Error updating package: ' + result.message, 'error');
        }
        return result;
    } catch (error) {
        showNotification('Error updating package: ' + error.message, 'error');
        return { success: false, message: error.message };
    }
};

window.deletePackage = async function(packageId) {
    try {
        if (confirm('Are you sure you want to delete this package?')) {
            const result = await window.packageManager.deletePackage(packageId);
            if (result.success) {
                showNotification('Package deleted successfully!', 'success');
                await loadPackagesFromUpstash(); // Refresh display
            } else {
                showNotification('Error deleting package: ' + result.message, 'error');
            }
            return result;
        }
    } catch (error) {
        showNotification('Error deleting package: ' + error.message, 'error');
        return { success: false, message: error.message };
    }
};

window.initializeSamplePackages = async function() {
    try {
        const result = await window.packageManager.initializeSamplePackages();
        if (result.success) {
            showNotification('Sample packages initialized!', 'success');
            await loadPackagesFromUpstash(); // Refresh display
        } else {
            showNotification('Error initializing packages: ' + result.message, 'error');
        }
        return result;
    } catch (error) {
        showNotification('Error initializing packages: ' + error.message, 'error');
        return { success: false, message: error.message };
    }
};
