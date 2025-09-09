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
    
    console.log('TravelBook website initialized successfully!');
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
                        <i class="fas fa-phone mr-2"></i>Call Now: (555) 123-4567
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
