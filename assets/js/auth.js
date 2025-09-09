/**
 * Authentication System for TravelBook Admin
 * Handles user authentication, session management, and security
 */

class AuthManager {
    constructor() {
        this.sessionKey = 'travelbook_admin_session';
        this.usersKey = 'travelbook_admin_users';
        this.loginAttemptsKey = 'travelbook_login_attempts';
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        // Initialize default admin user if none exists
        this.initializeDefaultAdmin();
    }
    
    /**
     * Initialize default admin user
     */
    initializeDefaultAdmin() {
        const existingUsers = this.getStoredUsers();
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
            
            this.saveUsers([defaultAdmin]);
            console.log('Default admin user created: username=admin, password=admin123');
        }
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
            const users = this.getStoredUsers();
            const user = users.find(u => u.username === username && u.is_active);
            
            if (!user) {
                this.recordFailedAttempt(username);
                throw new Error('Invalid username or password');
            }
            
            // Verify password
            const hashedPassword = this.hashPassword(password);
            if (user.password !== hashedPassword) {
                this.recordFailedAttempt(username);
                throw new Error('Invalid username or password');
            }
            
            // Clear failed attempts on successful login
            this.clearFailedAttempts(username);
            
            // Create session
            const session = this.createSession(user, rememberMe);
            
            // Update last login
            user.last_login = new Date().toISOString();
            this.saveUsers(users);
            
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
     * Get stored users
     */
    getStoredUsers() {
        try {
            const users = localStorage.getItem(this.usersKey);
            return users ? JSON.parse(users) : [];
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Save users
     */
    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
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
    createUser(userData) {
        const users = this.getStoredUsers();
        
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
        this.saveUsers(users);
        
        return {
            success: true,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        };
    }
    
    /**
     * Update user password
     */
    updatePassword(username, currentPassword, newPassword) {
        const users = this.getStoredUsers();
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
        
        this.saveUsers(users);
        
        return {
            success: true,
            message: 'Password updated successfully'
        };
    }
    
    /**
     * Get all users (admin only)
     */
    getAllUsers() {
        const users = this.getStoredUsers();
        return users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            last_login: user.last_login,
            is_active: user.is_active
        }));
    }
    
    /**
     * Toggle user status
     */
    toggleUserStatus(userId) {
        const users = this.getStoredUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }
        
        users[userIndex].is_active = !users[userIndex].is_active;
        users[userIndex].updated_at = new Date().toISOString();
        
        this.saveUsers(users);
        
        return {
            success: true,
            is_active: users[userIndex].is_active
        };
    }
}

// Create global instance
window.authManager = new AuthManager();
