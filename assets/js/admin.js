/**
 * Admin Panel JavaScript
 * Package management interface for TravelBook
 */

let currentEditingPackage = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

/**
 * Initialize admin panel
 */
async function initializeAdmin() {
    try {
        // Check if Upstash is configured
        if (!window.UPSTASH_CONFIG || !window.UPSTASH_CONFIG.url || window.UPSTASH_CONFIG.url.includes('your-endpoint')) {
            showAdminNotification('Upstash not configured. Please update your credentials in upstash-config.js', 'warning');
            return;
        }
        
        // Initialize event listeners
        initEventListeners();
        
        // Load initial data
        await loadPackageStats();
        await loadPackages();
        
        console.log('Admin panel initialized successfully!');
        
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showAdminNotification('Error initializing admin panel: ' + error.message, 'error');
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Add package button
    document.getElementById('add-package-btn').addEventListener('click', () => {
        openPackageModal();
    });
    
    // Initialize sample packages button
    document.getElementById('init-sample-btn').addEventListener('click', async () => {
        if (confirm('This will add sample packages to your database. Continue?')) {
            await initializeSamplePackages();
        }
    });
    
    // Export packages button
    document.getElementById('export-packages-btn').addEventListener('click', exportPackages);
    
    // Refresh packages button
    document.getElementById('refresh-packages').addEventListener('click', async () => {
        await loadPackageStats();
        await loadPackages();
    });
    
    // Modal controls
    document.getElementById('close-modal').addEventListener('click', closePackageModal);
    document.getElementById('cancel-btn').addEventListener('click', closePackageModal);
    
    // Package form submission
    document.getElementById('package-form').addEventListener('submit', handlePackageSubmit);
    
    // Close modal on outside click
    document.getElementById('package-modal').addEventListener('click', (e) => {
        if (e.target.id === 'package-modal') {
            closePackageModal();
        }
    });
}

/**
 * Load package statistics
 */
async function loadPackageStats() {
    try {
        const result = await window.packageManager.getPackageStats();
        
        if (result.success) {
            const stats = result.stats;
            document.getElementById('total-packages').textContent = stats.total_packages;
            document.getElementById('active-packages').textContent = stats.active_packages;
            document.getElementById('inactive-packages').textContent = stats.inactive_packages;
            document.getElementById('average-price').textContent = '$' + stats.average_price.toLocaleString();
        } else {
            showAdminNotification('Error loading statistics: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error loading package stats:', error);
        showAdminNotification('Error loading statistics: ' + error.message, 'error');
    }
}

/**
 * Load packages table
 */
async function loadPackages() {
    try {
        const result = await window.packageManager.getAllPackages(false);
        
        if (result.success) {
            displayPackagesTable(result.packages);
        } else {
            showAdminNotification('Error loading packages: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error loading packages:', error);
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
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
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
    
    // Reset form
    form.reset();
    currentEditingPackage = null;
    
    if (packageData) {
        // Edit mode
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
        document.getElementById('is_active').checked = packageData.is_active;
    } else {
        // Add mode
        title.textContent = 'Add New Package';
        document.getElementById('is_active').checked = true;
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
    
    try {
        let result;
        
        if (currentEditingPackage) {
            // Update existing package
            result = await window.packageManager.updatePackage(currentEditingPackage.id, packageData);
        } else {
            // Create new package
            result = await window.packageManager.createPackage(packageData);
        }
        
        if (result.success) {
            showAdminNotification(
                currentEditingPackage ? 'Package updated successfully!' : 'Package created successfully!', 
                'success'
            );
            closePackageModal();
            await loadPackageStats();
            await loadPackages();
        } else {
            showAdminNotification('Error: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error saving package:', error);
        showAdminNotification('Error saving package: ' + error.message, 'error');
    }
}

/**
 * Edit package
 */
async function editPackage(packageId) {
    try {
        const result = await window.packageManager.getPackage(packageId);
        
        if (result.success) {
            openPackageModal(result.package);
        } else {
            showAdminNotification('Error loading package: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error loading package:', error);
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
        console.error('Error toggling package status:', error);
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
            console.error('Error deleting package:', error);
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
        console.error('Error initializing sample packages:', error);
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
        console.error('Error exporting packages:', error);
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
