/**
 * Admin Panel JavaScript
 * Package management interface for TravelBook
 */

let currentEditingPackage = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Delay initialization to ensure all scripts are loaded
    setTimeout(() => {
        initializeAdmin();
    }, 100);
});

/**
 * Initialize admin panel
 */
async function initializeAdmin() {
    try {
        // Check authentication first
        if (!window.authManager.requireAuth()) {
            return; // Will redirect to login page
        }
        
        // Initialize auto-logout system for admin panel
        await window.authManager.initializeAutoLogout();
        
        // Display user info
        displayUserInfo();
        
        // Check if Upstash is configured
        if (!window.UPSTASH_CONFIG || !window.UPSTASH_CONFIG.apiBase) {
            showAdminNotification('Upstash not configured. Please update your credentials in upstash-config.js', 'warning');
            return;
        }
        
        // Initialize event listeners
        initEventListeners();
        
        // Load initial data
        await loadPackageStats();
        await loadPackages();
        
        
    } catch (error) {
        showAdminNotification('Error initializing admin panel: ' + error.message, 'error');
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Add package button
    const addPackageBtn = document.getElementById('add-package-btn');
    if (addPackageBtn) {
        addPackageBtn.addEventListener('click', () => {
            console.log('Add package button clicked');
            openPackageModal();
        });
    }
    
    // Initialize sample packages button (if exists)
    const initSampleBtn = document.getElementById('init-sample-btn');
    if (initSampleBtn) {
        initSampleBtn.addEventListener('click', async () => {
            if (confirm('This will add sample packages to your database. Continue?')) {
                await initializeSamplePackages();
            }
        });
    }
    
    // Export packages button (if exists)
    const exportPackagesBtn = document.getElementById('export-packages-btn');
    if (exportPackagesBtn) {
        exportPackagesBtn.addEventListener('click', exportPackages);
    }
    
    // Refresh packages button
    const refreshPackagesBtn = document.getElementById('refresh-packages');
    if (refreshPackagesBtn) {
        refreshPackagesBtn.addEventListener('click', async () => {
            await loadPackageStats();
            await loadPackages();
        });
    }
    
    // Modal controls
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePackageModal);
    }
    
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closePackageModal);
    }
    
    // Package form submission
    const packageForm = document.getElementById('package-form');
    if (packageForm) {
        packageForm.addEventListener('submit', handlePackageSubmit);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Filter buttons
    const filterAllBtn = document.getElementById('filter-all');
    if (filterAllBtn) {
        filterAllBtn.addEventListener('click', () => filterPackages('all'));
    }
    
    const filterPopularBtn = document.getElementById('filter-popular');
    if (filterPopularBtn) {
        filterPopularBtn.addEventListener('click', () => filterPackages('popular'));
    }
    
    const filterLuxuryBtn = document.getElementById('filter-luxury');
    if (filterLuxuryBtn) {
        filterLuxuryBtn.addEventListener('click', () => filterPackages('luxury'));
    }
    
    const filterBudgetBtn = document.getElementById('filter-budget');
    if (filterBudgetBtn) {
        filterBudgetBtn.addEventListener('click', () => filterPackages('budget'));
    }
    
    // Close modal on outside click
    const packageModal = document.getElementById('package-modal');
    if (packageModal) {
        packageModal.addEventListener('click', (e) => {
            if (e.target.id === 'package-modal') {
                closePackageModal();
            }
        });
    }
}

/**
 * Load package statistics
 */
async function loadPackageStats() {
    try {
        const result = await window.packageManager.getPackageStats();
        
        if (result.success) {
            // The statistics are returned directly in the result object
            document.getElementById('total-packages').textContent = result.total_packages || 0;
            document.getElementById('active-packages').textContent = result.active_packages || 0;
            document.getElementById('inactive-packages').textContent = result.inactive_packages || 0;
            document.getElementById('average-price').textContent = '$' + (result.average_price || 0).toLocaleString();
        } else {
            showAdminNotification('Error loading statistics: ' + result.message, 'error');
        }
        
    } catch (error) {
        showAdminNotification('Error loading statistics: ' + error.message, 'error');
    }
}

/**
 * Load packages table
 */
async function loadPackages() {
    try {
        // Check if package manager is available
        if (!window.packageManager) {
            showAdminNotification('Package manager not available', 'error');
            return;
        }
        
        const result = await window.packageManager.getAllPackages(false);
        
        if (result.success && result.packages && result.packages.length > 0) {
            displayPackagesTable(result.packages);
        } else {
            showAdminNotification('Error loading packages: ' + (result.message || 'No packages found'), 'error');
        }
        
    } catch (error) {
        showAdminNotification('Error loading packages: ' + error.message, 'error');
    }
}

/**
 * Display packages in table
 */
function displayPackagesTable(packages) {
    const tbody = document.getElementById('packages-table-body');
    tbody.innerHTML = '';
    
    if (packages.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No packages found. <button onclick="initializeSamplePackages()" class="text-primary-600 hover:text-primary-800 underline">Add sample packages</button>
                </td>
            </tr>
        `;
        return;
    }
    
    packages.forEach(packageData => {
        const row = createPackageTableRow(packageData);
        tbody.appendChild(row);
    });
}

/**
 * Create package table row
 */
function createPackageTableRow(packageData) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    const statusBadge = packageData.is_active 
        ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>'
        : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>';
    
    const ratingStars = generateStarRating(packageData.rating);
    
    // Generate tag badge
    const tagBadge = packageData.tag ? 
        `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            packageData.tag === 'popular' ? 'bg-red-100 text-red-800' :
            packageData.tag === 'luxury' ? 'bg-purple-100 text-purple-800' :
            packageData.tag === 'budget' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
        }">${packageData.tag.charAt(0).toUpperCase() + packageData.tag.slice(1)}</span>` :
        '<span class="text-gray-400 text-xs">No category</span>';
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <div class="flex-shrink-0 h-12 w-12">
                    <img class="h-12 w-12 rounded-lg object-cover" src="${packageData.image_url}" alt="${packageData.title}">
                </div>
                <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${packageData.title}</div>
                    <div class="text-sm text-gray-500">${packageData.duration || 'N/A'}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${packageData.destination}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            $${packageData.price.toLocaleString()} ${packageData.currency}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                ${ratingStars}
                <span class="ml-1 text-sm text-gray-500">(${packageData.rating})</span>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            ${tagBadge}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            ${statusBadge}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
            <button onclick="editPackage('${packageData.id}')" 
                    class="text-primary-600 hover:text-primary-900">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="togglePackageStatus('${packageData.id}')" 
                    class="text-yellow-600 hover:text-yellow-900">
                <i class="fas fa-toggle-${packageData.is_active ? 'on' : 'off'}"></i>
            </button>
            <button onclick="deletePackage('${packageData.id}')" 
                    class="text-red-600 hover:text-red-900">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
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
        starsHtml += '<i class="fas fa-star text-yellow-400"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star text-yellow-400"></i>';
    }
    
    return starsHtml;
}

/**
 * Open package modal for adding/editing
 */
function openPackageModal(packageData = null) {
    const modal = document.getElementById('package-modal');
    const form = document.getElementById('package-form');
    const title = document.getElementById('modal-title');
    
    console.log('Opening package modal with data:', packageData);
    
    // Reset form and clear all fields
    form.reset();
    currentEditingPackage = null;
    
    // Clear the package ID field completely
    document.getElementById('package-id').value = '';
    
    if (packageData) {
        // Edit mode
        showAdminNotification(`Opening edit modal for package: ${packageData.id}`, 'info');
        title.textContent = 'Edit Package';
        currentEditingPackage = packageData;
        
        // Populate form fields
        document.getElementById('package-id').value = packageData.id;
        document.getElementById('title').value = packageData.title;
        document.getElementById('description').value = packageData.description;
        document.getElementById('price').value = packageData.price;
        document.getElementById('currency').value = packageData.currency;
        document.getElementById('image_url').value = packageData.image_url;
        document.getElementById('destination').value = packageData.destination;
        document.getElementById('duration').value = packageData.duration || '';
        document.getElementById('rating').value = packageData.rating;
        document.getElementById('badge').value = packageData.badge || '';
        document.getElementById('badge_color').value = packageData.badge_color || 'bg-blue-500';
        document.getElementById('tag').value = packageData.tag || '';
        document.getElementById('is_active').checked = packageData.is_active;
        
        showAdminNotification(`Edit mode activated. Package ID: ${packageData.id}`, 'success');
    } else {
        // Add mode - ensure all fields are clear and currentEditingPackage is null
        showAdminNotification('Opening add new package modal', 'info');
        title.textContent = 'Add New Package';
        currentEditingPackage = null; // Explicitly set to null
        
        // Clear all form fields
        document.getElementById('package-id').value = '';
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('price').value = '';
        document.getElementById('currency').value = 'USD';
        document.getElementById('image_url').value = '';
        document.getElementById('destination').value = '';
        document.getElementById('duration').value = '';
        document.getElementById('rating').value = '5';
        document.getElementById('badge').value = '';
        document.getElementById('badge_color').value = 'bg-blue-500';
        document.getElementById('tag').value = '';
        document.getElementById('is_active').checked = true;
        
        showAdminNotification('Add mode activated - creating new package', 'success');
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close package modal
 */
function closePackageModal() {
    const modal = document.getElementById('package-modal');
    modal.classList.add('hidden');
    currentEditingPackage = null;
}

/**
 * Handle package form submission
 */
async function handlePackageSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const packageData = Object.fromEntries(formData);
    
    // Convert price to number
    packageData.price = parseFloat(packageData.price);
    packageData.rating = parseFloat(packageData.rating);
    packageData.is_active = packageData.is_active === 'on';
    
    // Check if we're in edit mode - only edit if currentEditingPackage is set
    const isEditMode = currentEditingPackage !== null;
    const packageId = document.getElementById('package-id').value;
    
    // Debug information
    console.log('Form submission debug:', {
        isEditMode,
        currentEditingPackage,
        packageId,
        packageData
    });
    console.log('Package data details:', JSON.stringify(packageData, null, 2));
    
    try {
        let result;
        
        if (isEditMode) {
            // Update existing package
            showAdminNotification(`Updating package: ${currentEditingPackage.id}`, 'info');
            result = await window.packageManager.updatePackage(currentEditingPackage.id, packageData);
        } else {
            // Create new package - ensure package-id is empty
            document.getElementById('package-id').value = '';
            showAdminNotification('Creating new package...', 'info');
            console.log('Calling createPackage with data:', packageData);
            result = await window.packageManager.createPackage(packageData);
            console.log('createPackage result:', JSON.stringify(result, null, 2));
        }
        
        if (result.success) {
            showAdminNotification(
                currentEditingPackage ? 'Package updated successfully!' : `Package created successfully! ID: ${result.package_id}`, 
                'success'
            );
            closePackageModal();
            await loadPackageStats();
            await loadPackages();
        } else {
            showAdminNotification('Error: ' + result.message, 'error');
        }
        
    } catch (error) {
        showAdminNotification('Error saving package: ' + error.message, 'error');
    }
}

/**
 * Edit package
 */
async function editPackage(packageId) {
    try {
        showAdminNotification(`Loading package for editing: ${packageId}`, 'info');
        
        const result = await window.packageManager.getPackage(packageId);
        
        if (result.success) {
            showAdminNotification(`Package loaded successfully. Opening edit modal...`, 'info');
            openPackageModal(result.package);
        } else {
            showAdminNotification('Error loading package: ' + result.message, 'error');
        }
        
    } catch (error) {
        showAdminNotification('Error loading package: ' + error.message, 'error');
    }
}

/**
 * Toggle package status
 */
async function togglePackageStatus(packageId) {
    try {
        const result = await window.packageManager.togglePackageStatus(packageId);
        
        if (result.success) {
            showAdminNotification('Package status updated!', 'success');
            await loadPackageStats();
            await loadPackages();
        } else {
            showAdminNotification('Error updating status: ' + result.message, 'error');
        }
        
    } catch (error) {
        showAdminNotification('Error updating status: ' + error.message, 'error');
    }
}

/**
 * Delete package
 */
async function deletePackage(packageId) {
    if (confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
        try {
            const result = await window.packageManager.deletePackage(packageId);
            
            if (result.success) {
                showAdminNotification('Package deleted successfully!', 'success');
                await loadPackageStats();
                await loadPackages();
            } else {
                showAdminNotification('Error deleting package: ' + result.message, 'error');
            }
            
        } catch (error) {
            showAdminNotification('Error deleting package: ' + error.message, 'error');
        }
    }
}

/**
 * Initialize sample packages
 */
async function initializeSamplePackages() {
    try {
        const result = await window.packageManager.initializeSamplePackages();
        
        if (result.success) {
            showAdminNotification('Sample packages initialized successfully!', 'success');
            await loadPackageStats();
            await loadPackages();
        } else {
            showAdminNotification('Error initializing packages: ' + result.message, 'error');
        }
        
    } catch (error) {
        showAdminNotification('Error initializing packages: ' + error.message, 'error');
    }
}

/**
 * Export packages to JSON
 */
async function exportPackages() {
    try {
        const result = await window.packageManager.getAllPackages(false);
        
        if (result.success) {
            const dataStr = JSON.stringify(result.packages, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `travelbook-packages-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            showAdminNotification('Packages exported successfully!', 'success');
        } else {
            showAdminNotification('Error exporting packages: ' + result.message, 'error');
        }
        
    } catch (error) {
        showAdminNotification('Error exporting packages: ' + error.message, 'error');
    }
}

/**
 * Show admin notification
 */
function showAdminNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;
    
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${colors[type]}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation' : 'info'}-circle mr-2"></i>
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
 * Handle logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        window.authManager.logout();
    }
}

/**
 * Filter packages by tag
 */
async function filterPackages(tag) {
    try {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('opacity-75');
        });
        
        const activeBtn = document.getElementById(`filter-${tag}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.classList.remove('opacity-75');
        }
        
        // Update table header
        const tableHeader = document.querySelector('.bg-white .px-6 h3');
        if (tableHeader) {
            const tagNames = {
                'all': 'All Packages',
                'popular': 'Popular Packages',
                'luxury': 'Luxury Packages',
                'budget': 'Budget Packages'
            };
            tableHeader.textContent = tagNames[tag] || 'All Packages';
        }
        
        // Filter packages
        const result = await window.packageManager.filterPackagesByTag(tag);
        
        if (result.success) {
            displayPackagesTable(result.packages);
            showAdminNotification(`Showing ${result.count} ${tag === 'all' ? '' : tag} packages`, 'info');
        } else {
            showAdminNotification('Error filtering packages: ' + result.message, 'error');
        }
        
    } catch (error) {
        showAdminNotification('Error filtering packages: ' + error.message, 'error');
    }
}

