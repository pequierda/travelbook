/**
 * Authentication System for TravelBook Admin
 * Handles user authentication, session management, and security
 */

class AuthManager {
    constructor() {
        this.sessionKey = 'travelbook_admin_session';
        this.usersKey = 'travelbook:admin_users';
        this.loginAttemptsKey = 'travelbook:login_attempts';
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        // Initialize default admin user if none exists
        this.initializeDefaultAdmin();
    }
    
    /**
     * Initialize default admin user
     */
    async initializeDefaultAdmin() {
        try {
            // Check if Upstash is available
            if (!window.UPSTASH_CONFIG || !window.UPSTASH_CONFIG.apiBase || window.UPSTASH_CONFIG.apiBase === 'your-endpoint') {
                console.log('Upstash not configured, using localStorage fallback');
                this.initializeLocalStorageFallback();
                return;
            }
            
            const existingUsers = await this.getStoredUsers();
            if (existingUsers.length === 0) {
                const defaultAdmin = {
                    id: 'admin_001',
                    username: 'admin',
                    password: this.hashPassword('admin123'), // Default password
                    email: 'admin@travelbooks.com',
                    role: 'admin',
                    created_at: new Date().toISOString(),
                    last_login: null,
                    is_active: true
                };
                
                await this.saveUsers([defaultAdmin]);
                console.log('Default admin user created: username=admin, password=admin123');
            }
        } catch (error) {
            console.error('Error initializing default admin:', error);
            // Fallback to localStorage
            this.initializeLocalStorageFallback();
        }
    }
    
    /**
     * Initialize localStorage fallback for when Upstash is not available
     */
    initializeLocalStorageFallback() {
        const existingUsers = this.getLocalStorageUsers();
        if (existingUsers.length === 0) {
            const defaultAdmin = {
                id: 'admin_001',
                username: 'admin',
                password: this.hashPassword('admin123'),
                email: 'admin@travelbooks.com',
                role: 'admin',
                created_at: new Date().toISOString(),
                last_login: null,
                is_active: true
            };
            
            this.saveLocalStorageUsers([defaultAdmin]);
            console.log('Default admin user created in localStorage: username=admin, password=admin123');
        }
    }
    
    /**
     * Get users from localStorage (fallback)
     */
    getLocalStorageUsers() {
        try {
            const users = localStorage.getItem('travelbook_admin_users_fallback');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Save users to localStorage (fallback)
     */
    saveLocalStorageUsers(users) {
        localStorage.setItem('travelbook_admin_users_fallback', JSON.stringify(users));
    }
    
    /**
     * Hash password using simple hash (in production, use bcrypt or similar)
     */
    hashPassword(password) {
        // Simple hash function - in production, use proper hashing
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    /**
     * Authenticate user
     */
    async authenticate(username, password, rememberMe = false) {
        try {
            // Check for lockout
            if (this.isAccountLocked(username)) {
                throw new Error('Account is temporarily locked due to too many failed login attempts. Please try again later.');
            }
            
            // Get users
            const users = await this.getStoredUsers();
            
            // Ensure users is an array
            if (!Array.isArray(users)) {
                console.error('Users data is not an array:', users);
                throw new Error('User data format error. Please contact administrator.');
            }
            
            const user = users.find(u => u && u.username === username && u.is_active);
            
            if (!user) {
                this.recordFailedAttempt(username);
                throw new Error('Invalid username or password');
            }
            
            // Verify password (support both hashed and plain text for backward compatibility)
            const hashedPassword = this.hashPassword(password);
            if (user.password !== hashedPassword && user.password !== password) {
                this.recordFailedAttempt(username);
                throw new Error('Invalid username or password');
            }
            
            // Clear failed attempts on successful login
            this.clearFailedAttempts(username);
            
            // Create session
            const session = this.createSession(user, rememberMe);
            
            // Update last login
            user.last_login = new Date().toISOString();
            await this.saveUsers(users);
            
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                session: session
            };
            
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    /**
     * Create user session
     */
    createSession(user, rememberMe = false) {
        const session = {
            id: this.generateSessionId(),
            user_id: user.id,
            username: user.username,
            role: user.role,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + this.sessionDuration).toISOString(),
            remember_me: rememberMe
        };
        
        // Store session
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        
        return session;
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) return false;
            
            const session = JSON.parse(sessionData);
            
            // Check if session is expired
            if (new Date(session.expires_at) < new Date()) {
                this.logout();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    }
    
    /**
     * Get current user session
     */
    getCurrentSession() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) return null;
            
            const session = JSON.parse(sessionData);
            
            // Check if session is expired
            if (new Date(session.expires_at) < new Date()) {
                this.logout();
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }
    
    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem(this.sessionKey);
        window.location.href = 'login.html';
    }
    
    /**
     * Require authentication for protected pages
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
    
    /**
     * Record failed login attempt
     */
    recordFailedAttempt(username) {
        const attempts = this.getFailedAttempts();
        const now = Date.now();
        
        if (!attempts[username]) {
            attempts[username] = [];
        }
        
        attempts[username].push(now);
        
        // Keep only recent attempts
        attempts[username] = attempts[username].filter(
            attempt => now - attempt < this.lockoutDuration
        );
        
        localStorage.setItem(this.loginAttemptsKey, JSON.stringify(attempts));
    }
    
    /**
     * Check if account is locked
     */
    isAccountLocked(username) {
        const attempts = this.getFailedAttempts();
        const userAttempts = attempts[username] || [];
        const now = Date.now();
        
        // Filter recent attempts
        const recentAttempts = userAttempts.filter(
            attempt => now - attempt < this.lockoutDuration
        );
        
        return recentAttempts.length >= this.maxLoginAttempts;
    }
    
    /**
     * Clear failed attempts for user
     */
    clearFailedAttempts(username) {
        const attempts = this.getFailedAttempts();
        delete attempts[username];
        localStorage.setItem(this.loginAttemptsKey, JSON.stringify(attempts));
    }
    
    /**
     * Get failed login attempts
     */
    getFailedAttempts() {
        try {
            const attempts = localStorage.getItem(this.loginAttemptsKey);
            return attempts ? JSON.parse(attempts) : {};
        } catch (error) {
            return {};
        }
    }
    
    /**
     * Get stored users from Upstash or localStorage fallback
     */
    async getStoredUsers() {
        try {
            // Check if Upstash is available
            if (!window.UPSTASH_CONFIG || !window.UPSTASH_CONFIG.apiBase || window.UPSTASH_CONFIG.apiBase === 'your-endpoint') {
                console.log('Using localStorage fallback for users');
                return this.getLocalStorageUsers();
            }
            
            const result = await upstashRequest('hgetall', [this.usersKey]);
            
            // Handle different data structures from Upstash
            if (!result) {
                return [];
            }
            
            // If result is an object, convert to array
            if (typeof result === 'object' && !Array.isArray(result)) {
                return Object.values(result).map(userStr => {
                    try {
                        return typeof userStr === 'string' ? JSON.parse(userStr) : userStr;
                    } catch (e) {
                        console.error('Error parsing user data:', e);
                        return null;
                    }
                }).filter(user => user !== null);
            }
            
            // If result is already an array
            if (Array.isArray(result)) {
                return result.map(userStr => {
                    try {
                        return typeof userStr === 'string' ? JSON.parse(userStr) : userStr;
                    } catch (e) {
                        console.error('Error parsing user data:', e);
                        return null;
                    }
                }).filter(user => user !== null);
            }
            
            return [];
        } catch (error) {
            console.error('Error getting users from Upstash, using localStorage fallback:', error);
            return this.getLocalStorageUsers();
        }
    }
    
    /**
     * Save users to Upstash
     */
    async saveUsers(users) {
        try {
            // Clear existing users
            await upstashRequest('del', [this.usersKey]);
            
            // Add each user
            for (const user of users) {
                await upstashRequest('hset', [this.usersKey, user.id, JSON.stringify(user)]);
            }
        } catch (error) {
            console.error('Error saving users to Upstash:', error);
            throw error;
        }
    }
    
    /**
     * Generate session ID
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Create new admin user
     */
    async createUser(userData) {
        try {
            const users = await this.getStoredUsers();
            
            // Check if username already exists
            if (users.find(u => u.username === userData.username)) {
                throw new Error('Username already exists');
            }
            
            const newUser = {
                id: 'user_' + Date.now(),
                username: userData.username,
                password: this.hashPassword(userData.password),
                email: userData.email,
                role: userData.role || 'admin',
                created_at: new Date().toISOString(),
                last_login: null,
                is_active: true
            };
            
            users.push(newUser);
            await this.saveUsers(users);
            
            return {
                success: true,
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    /**
     * Update user password
     */
    async updatePassword(username, currentPassword, newPassword) {
        try {
            const users = await this.getStoredUsers();
            const userIndex = users.findIndex(u => u.username === username);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            
            const user = users[userIndex];
            
            // Verify current password
            if (user.password !== this.hashPassword(currentPassword)) {
                throw new Error('Current password is incorrect');
            }
            
            // Update password
            user.password = this.hashPassword(newPassword);
            user.updated_at = new Date().toISOString();
            
            await this.saveUsers(users);
            
            return {
                success: true,
                message: 'Password updated successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    /**
     * Get all users (admin only)
     */
    async getAllUsers() {
        try {
            const users = await this.getStoredUsers();
            return users.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                last_login: user.last_login,
                is_active: user.is_active
            }));
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
    
    /**
     * Toggle user status
     */
    async toggleUserStatus(userId) {
        try {
            const users = await this.getStoredUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            
            users[userIndex].is_active = !users[userIndex].is_active;
            users[userIndex].updated_at = new Date().toISOString();
            
            await this.saveUsers(users);
            
            return {
                success: true,
                is_active: users[userIndex].is_active
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Create global instance
window.authManager = new AuthManager();
