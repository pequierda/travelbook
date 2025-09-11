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
            let packageId = await this.generatePackageId();
            console.log('Generated package ID:', packageId);
            
            // Check if package already exists
            const existingPackage = await upstashRequest('hget', [this.packagesKey, packageId]);
            if (existingPackage) {
                console.warn('Package ID already exists, generating new one...');
                // Generate a new ID using timestamp
                packageId = `package_${Date.now()}`;
                console.log('Using timestamp-based ID:', packageId);
            }
            
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
                tag: packageData.tag || '',
                features: packageData.features || [],
                included: packageData.included || [],
                excluded: packageData.excluded || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_active: packageData.is_active !== false,
                sort_order: parseInt(packageData.sort_order || 0)
            };
            
            // Store package in Redis
            console.log('Storing package in Redis with key:', this.packagesKey, 'and ID:', packageId);
            await upstashRequest('hset', [this.packagesKey, packageId, JSON.stringify(packageObj)]);
            console.log('Package stored successfully in Redis');
            
            // Add to active packages list
            if (packageObj.is_active) {
                console.log('Adding package to active packages list');
                await upstashRequest('sadd', [this.activePackagesKey, packageId]);
                console.log('Package added to active packages list');
            }
            
            const result = {
                success: true,
                message: 'Package created successfully',
                package_id: packageId,
                package: packageObj
            };
            
            console.log('Returning success result:', JSON.stringify(result, null, 2));
            return result;
            
        } catch (error) {
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
                // Get all package IDs from hash keys using HGETALL
                const allPackages = await upstashRequest('hgetall', [this.packagesKey]);
                packageIds = [];
                
                // Handle the array format from Upstash HGETALL
                if (Array.isArray(allPackages)) {
                    for (let i = 0; i < allPackages.length; i += 2) {
                        const key = allPackages[i];
                        if (key) {
                            packageIds.push(key);
                        }
                    }
                } else if (typeof allPackages === 'object' && allPackages !== null) {
                    packageIds = Object.keys(allPackages);
                }
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
            return {
                success: false,
                message: 'Error loading packages: ' + error.message,
                packages: [],
                count: 0
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
            return {
                success: false,
                message: 'Error loading package: ' + error.message
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
            
            // Prepare updated package data
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
                tag: packageData.tag || '',
                features: packageData.features || [],
                included: packageData.included || [],
                excluded: packageData.excluded || [],
                created_at: JSON.parse(existingPackage).created_at,
                updated_at: new Date().toISOString(),
                is_active: packageData.is_active !== false,
                sort_order: parseInt(packageData.sort_order || 0)
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
                message: 'Package status updated successfully',
                is_active: packageObj.is_active
            };
            
        } catch (error) {
            return {
                success: false,
                message: 'Error updating package status: ' + error.message
            };
        }
    }
    
    /**
     * Filter packages by tag
     */
    async filterPackagesByTag(tag) {
        try {
            const allPackages = await this.getAllPackages(false);
            let packages = allPackages.packages;
            
            if (tag && tag !== 'all') {
                packages = packages.filter(packageObj => 
                    packageObj.tag && packageObj.tag.toLowerCase() === tag.toLowerCase()
                );
            }
            
            return {
                success: true,
                packages: packages,
                count: packages.length
            };
            
        } catch (error) {
            return {
                success: false,
                message: 'Error filtering packages: ' + error.message,
                packages: [],
                count: 0
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
            if (filters.destination) {
                packages = packages.filter(packageObj => 
                    packageObj.destination.toLowerCase().includes(filters.destination.toLowerCase())
                );
            }
            
            if (filters.minPrice !== undefined) {
                packages = packages.filter(packageObj => packageObj.price >= filters.minPrice);
            }
            
            if (filters.maxPrice !== undefined) {
                packages = packages.filter(packageObj => packageObj.price <= filters.maxPrice);
            }
            
            if (filters.isActive !== undefined) {
                packages = packages.filter(packageObj => packageObj.is_active === filters.isActive);
            }
            
            return {
                success: true,
                packages: packages,
                count: packages.length
            };
            
        } catch (error) {
            return {
                success: false,
                message: 'Error searching packages: ' + error.message,
                packages: [],
                count: 0
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
                total_packages: totalPackages,
                active_packages: activeCount,
                inactive_packages: totalPackages - activeCount,
                average_price: avgPrice
            };
            
        } catch (error) {
            return {
                success: false,
                message: 'Error loading package statistics: ' + error.message
            };
        }
    }
    
    /**
     * Generate unique package ID
     */
    async generatePackageId() {
        try {
            // Get current counter
            const counter = await upstashRequest('get', [this.packageCounterKey]);
            console.log('Current counter from database:', counter);
            
            let newCounter;
            if (counter && !isNaN(parseInt(counter))) {
                newCounter = parseInt(counter) + 1;
            } else {
                // If no counter exists, check existing packages to find the highest ID
                const allPackages = await this.getAllPackages(false);
                let maxId = 0;
                
                for (const pkg of allPackages.packages) {
                    const idMatch = pkg.id.match(/package_(\d+)/);
                    if (idMatch) {
                        const idNum = parseInt(idMatch[1]);
                        if (idNum > maxId) {
                            maxId = idNum;
                        }
                    }
                }
                
                newCounter = maxId + 1;
            }
            
            console.log('Generated new counter:', newCounter);
            
            // Update counter
            await upstashRequest('set', [this.packageCounterKey, newCounter.toString()]);
            
            return `package_${newCounter}`;
            
        } catch (error) {
            console.error('Error generating package ID:', error);
            // Fallback to timestamp-based ID
            return `package_${Date.now()}`;
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