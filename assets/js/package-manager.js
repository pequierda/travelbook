/**
 * Package Manager for TravelBook
 * Client-side package management using Upstash Redis
 */

class PackageManager {
    constructor() {
        this.packagesKey = 'travelbook:packages';
        this.activePackagesKey = 'travelbook:active_packages';
        this.packageCounterKey = 'travelbook:package_counter';
    }
    
    /**
     * Create a new travel package
     */
    async createPackage(packageData) {
        try {
            // Validate required fields
            const requiredFields = ['title', 'description', 'price', 'image_url', 'destination'];
            for (const field of requiredFields) {
                if (!packageData[field]) {
                    throw new Error(`Required field '${field}' is missing`);
                }
            }
            
            // Generate unique ID
            const packageId = await this.generatePackageId();
            
            // Prepare package data
            const packageObj = {
                id: packageId,
                title: packageData.title.trim(),
                description: packageData.description.trim(),
                price: parseFloat(packageData.price),
                currency: packageData.currency || 'USD',
                image_url: packageData.image_url.trim(),
                destination: packageData.destination.trim(),
                duration: packageData.duration || '',
                rating: parseFloat(packageData.rating || 5.0),
                badge: packageData.badge || '',
                badge_color: packageData.badge_color || 'bg-blue-500',
                features: packageData.features || [],
                included: packageData.included || [],
                excluded: packageData.excluded || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_active: packageData.is_active !== false,
                sort_order: parseInt(packageData.sort_order || 0)
            };
            
            // Store package in Redis
            await upstashRequest('hset', [this.packagesKey, packageId, JSON.stringify(packageObj)]);
            
            // Add to active packages list
            if (packageObj.is_active) {
                await upstashRequest('sadd', [this.activePackagesKey, packageId]);
            }
            
            return {
                success: true,
                message: 'Package created successfully',
                package_id: packageId,
                package: packageObj
            };
            
        } catch (error) {
            console.error('Error creating package:', error);
            return {
                success: false,
                message: 'Error creating package: ' + error.message
            };
        }
    }
    
    /**
     * Get all packages
     */
    async getAllPackages(activeOnly = true) {
        try {
            let packageIds;
            
            if (activeOnly) {
                packageIds = await upstashRequest('smembers', [this.activePackagesKey]);
            } else {
                // Get all package IDs from hash keys
                const allKeys = await upstashRequest('keys', [`${this.packagesKey}:*`]);
                packageIds = allKeys.map(key => key.replace(`${this.packagesKey}:`, ''));
            }
            
            const packages = [];
            for (const packageId of packageIds) {
                const packageData = await upstashRequest('hget', [this.packagesKey, packageId]);
                if (packageData) {
                    packages.push(JSON.parse(packageData));
                }
            }
            
            // Sort by sort_order and created_at
            packages.sort((a, b) => {
                if (a.sort_order === b.sort_order) {
                    return new Date(b.created_at) - new Date(a.created_at);
                }
                return a.sort_order - b.sort_order;
            });
            
            return {
                success: true,
                packages: packages,
                count: packages.length
            };
            
        } catch (error) {
            console.error('Error fetching packages:', error);
            return {
                success: false,
                message: 'Error fetching packages: ' + error.message,
                packages: []
            };
        }
    }
    
    /**
     * Get package by ID
     */
    async getPackage(packageId) {
        try {
            const packageData = await upstashRequest('hget', [this.packagesKey, packageId]);
            
            if (!packageData) {
                return {
                    success: false,
                    message: 'Package not found'
                };
            }
            
            return {
                success: true,
                package: JSON.parse(packageData)
            };
            
        } catch (error) {
            console.error('Error fetching package:', error);
            return {
                success: false,
                message: 'Error fetching package: ' + error.message
            };
        }
    }
    
    /**
     * Update package
     */
    async updatePackage(packageId, packageData) {
        try {
            // Check if package exists
            const existingPackage = await upstashRequest('hget', [this.packagesKey, packageId]);
            if (!existingPackage) {
                return {
                    success: false,
                    message: 'Package not found'
                };
            }
            
            // Merge with existing data
            const packageObj = {
                ...JSON.parse(existingPackage),
                ...packageData,
                updated_at: new Date().toISOString()
            };
            
            // Update package in Redis
            await upstashRequest('hset', [this.packagesKey, packageId, JSON.stringify(packageObj)]);
            
            // Update active packages list
            if (packageObj.is_active) {
                await upstashRequest('sadd', [this.activePackagesKey, packageId]);
            } else {
                await upstashRequest('srem', [this.activePackagesKey, packageId]);
            }
            
            return {
                success: true,
                message: 'Package updated successfully',
                package: packageObj
            };
            
        } catch (error) {
            console.error('Error updating package:', error);
            return {
                success: false,
                message: 'Error updating package: ' + error.message
            };
        }
    }
    
    /**
     * Delete package
     */
    async deletePackage(packageId) {
        try {
            // Check if package exists
            const packageData = await upstashRequest('hget', [this.packagesKey, packageId]);
            if (!packageData) {
                return {
                    success: false,
                    message: 'Package not found'
                };
            }
            
            // Remove from Redis
            await upstashRequest('hdel', [this.packagesKey, packageId]);
            await upstashRequest('srem', [this.activePackagesKey, packageId]);
            
            return {
                success: true,
                message: 'Package deleted successfully'
            };
            
        } catch (error) {
            console.error('Error deleting package:', error);
            return {
                success: false,
                message: 'Error deleting package: ' + error.message
            };
        }
    }
    
    /**
     * Toggle package active status
     */
    async togglePackageStatus(packageId) {
        try {
            const packageData = await upstashRequest('hget', [this.packagesKey, packageId]);
            if (!packageData) {
                return {
                    success: false,
                    message: 'Package not found'
                };
            }
            
            const packageObj = JSON.parse(packageData);
            packageObj.is_active = !packageObj.is_active;
            packageObj.updated_at = new Date().toISOString();
            
            await upstashRequest('hset', [this.packagesKey, packageId, JSON.stringify(packageObj)]);
            
            if (packageObj.is_active) {
                await upstashRequest('sadd', [this.activePackagesKey, packageId]);
            } else {
                await upstashRequest('srem', [this.activePackagesKey, packageId]);
            }
            
            return {
                success: true,
                message: 'Package status updated',
                is_active: packageObj.is_active
            };
            
        } catch (error) {
            console.error('Error updating package status:', error);
            return {
                success: false,
                message: 'Error updating package status: ' + error.message
            };
        }
    }
    
    /**
     * Search packages
     */
    async searchPackages(query, filters = {}) {
        try {
            const allPackages = await this.getAllPackages(false);
            let packages = allPackages.packages;
            
            // Filter by query
            if (query) {
                packages = packages.filter(packageObj => 
                    packageObj.title.toLowerCase().includes(query.toLowerCase()) ||
                    packageObj.description.toLowerCase().includes(query.toLowerCase()) ||
                    packageObj.destination.toLowerCase().includes(query.toLowerCase())
                );
            }
            
            // Apply additional filters
            if (filters.min_price) {
                packages = packages.filter(packageObj => packageObj.price >= filters.min_price);
            }
            
            if (filters.max_price) {
                packages = packages.filter(packageObj => packageObj.price <= filters.max_price);
            }
            
            if (filters.destination) {
                packages = packages.filter(packageObj => 
                    packageObj.destination.toLowerCase().includes(filters.destination.toLowerCase())
                );
            }
            
            return {
                success: true,
                packages: packages,
                count: packages.length
            };
            
        } catch (error) {
            console.error('Error searching packages:', error);
            return {
                success: false,
                message: 'Error searching packages: ' + error.message,
                packages: []
            };
        }
    }
    
    /**
     * Get package statistics
     */
    async getPackageStats() {
        try {
            const allPackages = await this.getAllPackages(false);
            const activePackages = await this.getAllPackages(true);
            
            const totalPackages = allPackages.packages.length;
            const activeCount = activePackages.packages.length;
            
            // Calculate average price
            const totalPrice = activePackages.packages.reduce((sum, packageObj) => sum + packageObj.price, 0);
            const avgPrice = activeCount > 0 ? totalPrice / activeCount : 0;
            
            return {
                success: true,
                stats: {
                    total_packages: totalPackages,
                    active_packages: activeCount,
                    inactive_packages: totalPackages - activeCount,
                    average_price: Math.round(avgPrice * 100) / 100
                }
            };
            
        } catch (error) {
            console.error('Error fetching statistics:', error);
            return {
                success: false,
                message: 'Error fetching statistics: ' + error.message
            };
        }
    }
    
    /**
     * Generate unique package ID
     */
    async generatePackageId() {
        try {
            const counter = await upstashRequest('get', [this.packageCounterKey]) || 0;
            const newCounter = parseInt(counter) + 1;
            await upstashRequest('set', [this.packageCounterKey, newCounter.toString()]);
            return 'pkg_' + newCounter.toString().padStart(6, '0');
        } catch (error) {
            // Fallback to timestamp-based ID
            return 'pkg_' + Date.now();
        }
    }
    
    /**
     * Initialize sample packages
     */
    async initializeSamplePackages() {
        const samplePackages = [
            {
                title: 'European Adventure',
                description: 'Explore the best of Europe with this 14-day journey through Paris, Rome, and Barcelona.',
                price: 2499.00,
                currency: 'USD',
                image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                destination: 'Europe',
                duration: '14 days',
                rating: 4.9,
                badge: 'Best Seller',
                badge_color: 'bg-yellow-500',
                features: ['Guided Tours', 'Luxury Hotels', 'Breakfast Included'],
                included: ['Accommodation', 'Transportation', 'Guided Tours'],
                excluded: ['Meals', 'Personal Expenses', 'Travel Insurance'],
                sort_order: 1
            },
            {
                title: 'Tropical Paradise',
                description: 'Relax in luxury at the Maldives with crystal clear waters and pristine beaches.',
                price: 3299.00,
                currency: 'USD',
                image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                destination: 'Maldives',
                duration: '7 days',
                rating: 4.8,
                badge: 'New',
                badge_color: 'bg-green-500',
                features: ['Overwater Villa', 'All Inclusive', 'Spa Access'],
                included: ['Accommodation', 'All Meals', 'Airport Transfer'],
                excluded: ['Flights', 'Personal Expenses', 'Spa Treatments'],
                sort_order: 2
            },
            {
                title: 'Mountain Explorer',
                description: 'Adventure through the Swiss Alps with hiking, skiing, and breathtaking mountain views.',
                price: 1899.00,
                currency: 'USD',
                image_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                destination: 'Switzerland',
                duration: '10 days',
                rating: 4.9,
                badge: 'Limited',
                badge_color: 'bg-red-500',
                features: ['Mountain Hiking', 'Ski Equipment', 'Expert Guide'],
                included: ['Accommodation', 'Equipment Rental', 'Guide Services'],
                excluded: ['Flights', 'Meals', 'Personal Gear'],
                sort_order: 3
            }
        ];
        
        const results = [];
        for (const packageData of samplePackages) {
            const result = await this.createPackage(packageData);
            results.push(result);
        }
        
        return {
            success: true,
            message: 'Sample packages initialized',
            results: results
        };
    }
}

// Create global instance
window.packageManager = new PackageManager();
