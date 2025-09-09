/**
 * Login Page JavaScript
 * Handles login form submission and authentication
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeLogin();
});

/**
 * Initialize login page
 */
function initializeLogin() {
    // Check if already logged in
    if (window.authManager.isAuthenticated()) {
        window.location.href = 'admin.html';
        return;
    }
    
    // Initialize event listeners
    initEventListeners();
    
    // Focus on username field
    document.getElementById('username').focus();
    
    console.log('Login page initialized');
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Login form submission
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Password visibility toggle
    document.getElementById('toggle-password').addEventListener('click', togglePasswordVisibility);
    
    // Enter key handling
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('login-form').dispatchEvent(new Event('submit'));
        }
    });
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const username = formData.get('username').trim();
    const password = formData.get('password');
    const rememberMe = formData.get('remember-me') === 'on';
    
    // Validate inputs
    if (!username || !password) {
        showLoginNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    setLoginButtonLoading(true);
    
    try {
        // Attempt authentication
        const result = await window.authManager.authenticate(username, password, rememberMe);
        
        if (result.success) {
            showLoginNotification('Login successful! Redirecting...', 'success');
            
            // Redirect to admin panel after short delay
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
            
        } else {
            showLoginNotification(result.message, 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showLoginNotification('An error occurred during login. Please try again.', 'error');
    } finally {
        setLoginButtonLoading(false);
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('toggle-password');
    const icon = toggleButton.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

/**
 * Set login button loading state
 */
function setLoginButtonLoading(loading) {
    const button = document.getElementById('login-btn');
    const buttonText = document.getElementById('login-btn-text');
    
    if (loading) {
        button.disabled = true;
        button.classList.add('opacity-75', 'cursor-not-allowed');
        buttonText.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';
    } else {
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
        buttonText.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
    }
}

/**
 * Show login notification
 */
function showLoginNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.login-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `login-notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;
    
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.className += ` ${colors[type]}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icons[type]} mr-2"></i>
            <span class="flex-1">${message}</span>
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
 * Handle forgot password (placeholder)
 */
function handleForgotPassword() {
    showLoginNotification('Please contact your system administrator to reset your password.', 'info');
}

// Add click handler for forgot password link
document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordLink = document.querySelector('a[href="#"]');
    if (forgotPasswordLink && forgotPasswordLink.textContent.includes('Forgot password')) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleForgotPassword();
        });
    }
});
