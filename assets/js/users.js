/**
 * User Management JavaScript
 * Handles user creation, editing, and password management
 */

let currentEditingUser = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeUsers();
});

/**
 * Initialize user management
 */
async function initializeUsers() {
    try {
        // Check authentication first
        if (!window.authManager.requireAuth()) {
            return; // Will redirect to login page
        }
        
        // Initialize auto-logout system for user management
        await window.authManager.initializeAutoLogout();
        
        // Display user info
        displayUserInfo();
        
        // Initialize event listeners
        initEventListeners();
        
        // Load users
        loadUsers();
        
        console.log('User management initialized successfully!');
        
    } catch (error) {
        console.error('Error initializing user management:', error);
        showUserNotification('Error initializing user management: ' + error.message, 'error');
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Add user button
    document.getElementById('add-user-btn').addEventListener('click', () => {
        openUserModal();
    });
    
    // Change password button
    document.getElementById('change-password-btn').addEventListener('click', () => {
        openPasswordModal();
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // User modal controls
    document.getElementById('close-user-modal').addEventListener('click', closeUserModal);
    document.getElementById('cancel-user-btn').addEventListener('click', closeUserModal);
    
    // Password modal controls
    document.getElementById('close-password-modal').addEventListener('click', closePasswordModal);
    document.getElementById('cancel-password-btn').addEventListener('click', closePasswordModal);
    
    // Form submissions
    document.getElementById('user-form').addEventListener('submit', handleUserSubmit);
    document.getElementById('password-form').addEventListener('submit', handlePasswordSubmit);
    
    // Close modals on outside click
    document.getElementById('user-modal').addEventListener('click', (e) => {
        if (e.target.id === 'user-modal') {
            closeUserModal();
        }
    });
    
    document.getElementById('password-modal').addEventListener('click', (e) => {
        if (e.target.id === 'password-modal') {
            closePasswordModal();
        }
    });
}

/**
 * Display user information
 */
function displayUserInfo() {
    const session = window.authManager.getCurrentSession();
    if (session) {
        const userInfoElement = document.getElementById('user-info');
        userInfoElement.innerHTML = `
            <i class="fas fa-user mr-1"></i>
            Welcome, <strong>${session.username}</strong>
        `;
    }
}

/**
 * Load and display users
 */
async function loadUsers() {
    try {
        const users = await window.authManager.getAllUsers();
        displayUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showUserNotification('Error loading users: ' + error.message, 'error');
    }
}

/**
 * Display users in table
 */
function displayUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No users found.
                </td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = createUserTableRow(user);
        tbody.appendChild(row);
    });
}

/**
 * Create user table row
 */
function createUserTableRow(user) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    const statusBadge = user.is_active 
        ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>'
        : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>';
    
    const roleBadge = user.role === 'admin' 
        ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>'
        : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Editor</span>';
    
    const createdDate = new Date(user.created_at).toLocaleDateString();
    const lastLoginDate = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <i class="fas fa-user text-primary-600"></i>
                    </div>
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${user.username}</div>
                    <div class="text-sm text-gray-500">${user.email}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            ${roleBadge}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${createdDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${lastLoginDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            ${statusBadge}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
            <button onclick="toggleUserStatus('${user.id}')" 
                    class="text-yellow-600 hover:text-yellow-900">
                <i class="fas fa-toggle-${user.is_active ? 'on' : 'off'}"></i>
            </button>
        </td>
    `;
    
    return row;
}

/**
 * Open user modal for adding/editing
 */
function openUserModal(user = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const title = document.getElementById('user-modal-title');
    
    // Reset form
    form.reset();
    currentEditingUser = null;
    
    if (user) {
        // Edit mode
        title.textContent = 'Edit User';
        currentEditingUser = user;
        
        // Populate form fields
        document.getElementById('user-username').value = user.username;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-is-active').checked = user.is_active;
        
        // Hide password field for editing
        document.getElementById('user-password').closest('div').style.display = 'none';
    } else {
        // Add mode
        title.textContent = 'Add New User';
        document.getElementById('user-is-active').checked = true;
        
        // Show password field for new users
        document.getElementById('user-password').closest('div').style.display = 'block';
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close user modal
 */
function closeUserModal() {
    const modal = document.getElementById('user-modal');
    modal.classList.add('hidden');
    currentEditingUser = null;
}

/**
 * Open password change modal
 */
function openPasswordModal() {
    const modal = document.getElementById('password-modal');
    const form = document.getElementById('password-form');
    
    // Reset form
    form.reset();
    
    modal.classList.remove('hidden');
}

/**
 * Close password modal
 */
function closePasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.classList.add('hidden');
}

/**
 * Handle user form submission
 */
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData);
    
    // Validate inputs
    if (!userData.username || !userData.email) {
        showUserNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (!currentEditingUser && !userData.password) {
        showUserNotification('Password is required for new users', 'error');
        return;
    }
    
    try {
        let result;
        
        if (currentEditingUser) {
            // Update existing user (password change handled separately)
            showUserNotification('User editing not implemented yet. Use password change for password updates.', 'info');
            return;
        } else {
            // Create new user
            result = window.authManager.createUser(userData);
        }
        
        if (result.success) {
            showUserNotification('User created successfully!', 'success');
            closeUserModal();
            loadUsers();
        } else {
            showUserNotification('Error: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error saving user:', error);
        showUserNotification('Error saving user: ' + error.message, 'error');
    }
}

/**
 * Handle password change form submission
 */
async function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const passwordData = Object.fromEntries(formData);
    
    // Validate inputs
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
        showUserNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
        showUserNotification('New passwords do not match', 'error');
        return;
    }
    
    if (passwordData.new_password.length < 6) {
        showUserNotification('New password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        const session = window.authManager.getCurrentSession();
        const result = window.authManager.updatePassword(
            session.username,
            passwordData.current_password,
            passwordData.new_password
        );
        
        if (result.success) {
            showUserNotification('Password changed successfully!', 'success');
            closePasswordModal();
        } else {
            showUserNotification('Error: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error changing password:', error);
        showUserNotification('Error changing password: ' + error.message, 'error');
    }
}

/**
 * Toggle user status
 */
async function toggleUserStatus(userId) {
    if (confirm('Are you sure you want to change this user\'s status?')) {
        try {
            const result = await window.authManager.toggleUserStatus(userId);
            
            if (result.success) {
                showUserNotification('User status updated!', 'success');
                await loadUsers();
            } else {
                showUserNotification('Error updating status: ' + result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error toggling user status:', error);
            showUserNotification('Error updating status: ' + error.message, 'error');
        }
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        window.authManager.logout();
    }
}

/**
 * Show user notification
 */
function showUserNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.user-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `user-notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;
    
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
