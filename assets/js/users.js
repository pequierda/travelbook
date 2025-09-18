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
    
    // Removed global "Change My Password" button
    
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
            <button onclick="editUser('${user.id}')" 
                    class="text-primary-600 hover:text-primary-900">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="openAdminPasswordModal('${user.username}')" 
                    class="text-blue-600 hover:text-blue-900">
                <i class="fas fa-key"></i>
            </button>
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
        
        // Hide password field for editing (use key icon instead)
        const pwdInput = document.getElementById('user-password');
        const pwdWrapper = pwdInput.closest('div');
        if (pwdWrapper) pwdWrapper.style.display = 'none';
        // Prevent browser validation on hidden field
        try { pwdInput.disabled = true; } catch(_) {}
        try { pwdInput.removeAttribute('required'); } catch(_) {}
        pwdInput.value = '';
    } else {
        // Add mode
        title.textContent = 'Add New User';
        document.getElementById('user-is-active').checked = true;
        
        // Show password field for new users
        const pwdInput = document.getElementById('user-password');
        const pwdWrapper = pwdInput.closest('div');
        if (pwdWrapper) pwdWrapper.style.display = 'block';
        try { pwdInput.disabled = false; } catch(_) {}
        try { pwdInput.setAttribute('required', ''); } catch(_) {}
        pwdInput.value = '';
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
    // Ensure current password field visible for self-change
    const currentField = document.getElementById('current-password');
    if (currentField) {
        const wrapper = currentField.closest('div');
        if (wrapper) wrapper.style.display = 'block';
        currentField.disabled = false;
        currentField.required = true;
        currentField.value = '';
    }
    modal.dataset.targetUser = '';
    
    modal.classList.remove('hidden');
}

/**
 * Close password modal
 */
function closePasswordModal() {
    const modal = document.getElementById('password-modal');
    modal.classList.add('hidden');
    modal.dataset.targetUser = '';
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
            // Update existing user (username, email, role, active)
            const users = await window.authManager.getStoredUsers();
            const idx = users.findIndex(u => u.id === currentEditingUser.id);
            if (idx === -1) throw new Error('User not found');
            users[idx].username = userData.username;
            users[idx].email = userData.email;
            users[idx].role = userData.role || users[idx].role;
            users[idx].is_active = userData.is_active === 'on';
            users[idx].updated_at = new Date().toISOString();
            await window.authManager.saveUsers(users);
            result = { success: true };
        } else {
            // Create new user
            result = await window.authManager.createUser(userData);
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
    
    const modal = document.getElementById('password-modal');
    const targetUser = modal.dataset.targetUser;
    
    // Validate inputs
    if ((!targetUser && !passwordData.current_password) || !passwordData.new_password || !passwordData.confirm_password) {
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
        let result;
        if (targetUser) {
            result = await window.authManager.adminSetPassword(targetUser, passwordData.new_password);
        } else {
            const session = window.authManager.getCurrentSession();
            result = await window.authManager.updatePassword(
                session.username,
                passwordData.current_password,
                passwordData.new_password
            );
        }
        
        if (result && result.success) {
            showUserNotification('Password changed successfully!', 'success');
            closePasswordModal();
        } else {
            showUserNotification('Error: ' + (result && result.message ? result.message : 'Unknown error'), 'error');
        }
        
    } catch (error) {
        console.error('Error changing password:', error);
        showUserNotification('Error changing password: ' + error.message, 'error');
    }
}

// Open password modal to set a user's password as admin (no current password required)
function openAdminPasswordModal(username) {
    const modal = document.getElementById('password-modal');
    const form = document.getElementById('password-form');
    if (!modal || !form) return;
    form.reset();
    modal.dataset.targetUser = username;
    const currentField = document.getElementById('current-password');
    if (currentField) {
        const wrapper = currentField.closest('div');
        if (wrapper) wrapper.style.display = 'none';
        currentField.disabled = true;
        currentField.required = false;
        currentField.value = '';
    }
    modal.classList.remove('hidden');
}

// Edit user (populate modal)
async function editUser(userId) {
    try {
        const users = await window.authManager.getStoredUsers();
        const user = users.find(u => u.id === userId);
        if (!user) {
            showUserNotification('User not found', 'error');
            return;
        }
        openUserModal(user);
    } catch (e) {
        showUserNotification('Error loading user for editing', 'error');
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
