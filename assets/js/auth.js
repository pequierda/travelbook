/**
 * Authentication System for TravelBook Admin
 * Handles user authentication, session management, and security
 */

class AuthManager {
    constructor() {
        this.sessionKey = 'travelbook_admin_session';
        this.usersKey = 'travelbook:admin_users';
        this.loginAttemptsKey = 'travelbook:login_attempts';
        this.activeSessionsKey = 'travelbook:active_sessions';
        this.maxLoginAttempts = 5;
        this.maxLoginAttemptsExtended = 10;
        this.lockoutDuration = 1 * 60 * 1000; // 1 minute
        this.extendedLockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
        
        // Auto-logout configuration
        this.inactivityTimeout = 1 * 60 * 1000; // 1 minute of inactivity
        this.warningTimeout = 30 * 1000; // 30 seconds warning before logout
        this.lastActivity = Date.now();
        this.timeoutId = null;
        this.warningTimeoutId = null;
        this.isWarningShown = false;
        this.sessionValidationInterval = null;
        this.isRedirecting = false;
        
        // Single session configuration
        this.allowMultipleSessions = true; // Temporarily disabled to fix redirect loop
        
        // Initialize default admin user if none exists
        this.initializeDefaultAdmin();
        
        // Reset redirect flag on page load
        this.isRedirecting = false;
        
        // Initialize auto-logout system
        this.initializeAutoLogout();
    }
    
    /**
     * Initialize default admin user
     */
    async initializeDefaultAdmin() {
        // No default admin creation - users must be created manually for security
    }
    
    /**
     * Initialize localStorage fallback for when Upstash is not available
     */
    initializeLocalStorageFallback() {
        // No default admin creation - users must be created manually for security
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
                const attempts = this.getFailedAttempts();
                const userAttempts = attempts[username] || [];
                const now = Date.now();
                const extendedRecentAttempts = userAttempts.filter(
                    attempt => now - attempt < this.extendedLockoutDuration
                );
                
                if (extendedRecentAttempts.length >= this.maxLoginAttemptsExtended) {
                    throw new Error('Account is locked for 15 minutes due to excessive failed login attempts. Please try again later.');
                } else {
                    throw new Error('Account is temporarily locked for 1 minute due to failed login attempts. Please try again later.');
                }
            }
            
            // Get users
            const users = await this.getStoredUsers();
            
            // Ensure users is an array
            if (!Array.isArray(users)) {
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
            
            // Check for existing sessions and logout other devices if needed
            if (!this.allowMultipleSessions) {
                await this.logoutOtherDevices(user.id);
            }
            
            // Create session
            const session = this.createSession(user, rememberMe);
            
            // Register this session as active
            await this.registerActiveSession(user.id, session.id);
            
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
    async isAuthenticated() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            if (!sessionData) return false;
            
            const session = JSON.parse(sessionData);
            
            // Check if session is expired
            if (new Date(session.expires_at) < new Date()) {
                return false;
            }
            
            // Check if session is still active (not logged out from another device)
            if (!this.allowMultipleSessions) {
                const isActive = await this.isSessionActive(session.user_id, session.id);
                if (!isActive) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
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
            return null;
        }
    }
    
    /**
     * Logout user
     */
    async logout() {
        try {
            // Get current session before clearing it
            const session = this.getCurrentSession();
            
            // Clear auto-logout timers
            this.clearAutoLogoutTimers();
            
            // Stop periodic session validation
            this.stopPeriodicSessionValidation();
            
            // Remove session from active sessions
            if (session && !this.allowMultipleSessions) {
                await this.removeActiveSession(session.user_id, session.id);
            }
            
            // Clear local session
            localStorage.removeItem(this.sessionKey);
            
            // Redirect to login
            window.location.href = 'login.html';
        } catch (error) {
            // Fallback logout
            localStorage.removeItem(this.sessionKey);
            window.location.href = 'login.html';
        }
    }
    
    /**
     * Require authentication for protected pages
     */
    requireAuth() {
        // Prevent multiple redirects
        if (this.isRedirecting) {
            return false;
        }
        
        // Don't check auth if we're already on login page
        if (this.isOnLoginPage()) {
            return true;
        }
        
        // Don't check auth if we're on index.html (public page)
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname === '/' || 
            window.location.pathname === '/travelbook/' ||
            window.location.pathname === '/travelbook/index.html') {
            return true;
        }
        
        // Simple sync check only
        const isAuth = this.isAuthenticatedSync();
        
        if (!isAuth) {
            this.isRedirecting = true;
            // Add a small delay to prevent rapid redirects
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 100);
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
        
        // Filter recent attempts (within 1 minute)
        const recentAttempts = userAttempts.filter(
            attempt => now - attempt < this.lockoutDuration
        );
        
        // Filter extended recent attempts (within 15 minutes)
        const extendedRecentAttempts = userAttempts.filter(
            attempt => now - attempt < this.extendedLockoutDuration
        );
        
        // Progressive lockout:
        // 1-5 attempts: 1 minute lockout
        // 6-10 attempts: 1 minute lockout
        // 10+ attempts: 15 minute lockout
        if (extendedRecentAttempts.length >= this.maxLoginAttemptsExtended) {
            return true; // 15 minute lockout
        } else if (recentAttempts.length >= this.maxLoginAttempts) {
            return true; // 1 minute lockout
        }
        
        return false;
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
            if (!window.UPSTASH_CONFIG || !window.UPSTASH_CONFIG.apiBase) {
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
                        return null;
                    }
                }).filter(user => user !== null);
            }
            
            // If result is already an array (Upstash HGETALL format)
            if (Array.isArray(result)) {
                // Upstash HGETALL returns [key1, value1, key2, value2, ...]
                const users = [];
                for (let i = 0; i < result.length; i += 2) {
                    const key = result[i];
                    const value = result[i + 1];
                    if (key && value) {
                        try {
                            const userData = typeof value === 'string' ? JSON.parse(value) : value;
                            users.push(userData);
                        } catch (e) {
                        }
                    }
                }
                return users;
            }
            
            return [];
        } catch (error) {
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
    
    /**
     * Initialize auto-logout system
     */
    async initializeAutoLogout() {
        // Only initialize if user is authenticated
        if (!this.isAuthenticatedSync()) {
            return;
        }
        
        // Set up activity tracking
        this.setupActivityTracking();
        
        // Start the inactivity timer
        this.resetInactivityTimer();
        
        // Start periodic session validation
        this.startPeriodicSessionValidation();
        
        console.log('Auto-logout system initialized - 1 minute inactivity timeout');
    }
    
    /**
     * Check if user is authenticated (synchronous version for constructor)
     */
    isAuthenticatedSync() {
        try {
            const sessionData = localStorage.getItem(this.sessionKey);
            
            if (!sessionData) {
                return false;
            }
            
            const session = JSON.parse(sessionData);
            
            // Check if session is expired
            if (new Date(session.expires_at) < new Date()) {
                return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Check if we're currently on the login page
     */
    isOnLoginPage() {
        const currentPath = window.location.pathname;
        const currentHref = window.location.href;
        
        return currentPath.includes('login.html') || 
               currentPath.endsWith('login.html') ||
               currentHref.includes('login.html') ||
               currentPath === '/login.html' ||
               currentPath === '/travelbook/login.html';
    }
    
    /**
     * Validate session in background (non-blocking)
     */
    async validateSessionInBackground() {
        try {
            const isAuth = await this.isAuthenticated();
            if (!isAuth) {
                // Show notification and logout after a delay
                this.showNotification(
                    'Your session has been invalidated from another device. You will be logged out.',
                    'warning'
                );
                
                setTimeout(() => {
                    this.logout();
                }, 3000);
            }
        } catch (error) {
            console.error('Error validating session:', error);
        }
    }
    
    /**
     * Start periodic session validation
     */
    startPeriodicSessionValidation() {
        // Validate session every 30 seconds
        this.sessionValidationInterval = setInterval(() => {
            this.validateSessionInBackground();
        }, 30000);
    }
    
    /**
     * Stop periodic session validation
     */
    stopPeriodicSessionValidation() {
        if (this.sessionValidationInterval) {
            clearInterval(this.sessionValidationInterval);
            this.sessionValidationInterval = null;
        }
    }
    
    /**
     * Set up activity tracking for mouse, keyboard, and touch events
     */
    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            }, true);
        });
        
        // Also track window focus/blur
        window.addEventListener('focus', () => {
            this.updateActivity();
        });
        
        window.addEventListener('blur', () => {
            // Don't update activity on blur, but don't clear timers either
        });
    }
    
    /**
     * Update last activity time and reset timers
     */
    updateActivity() {
        this.lastActivity = Date.now();
        
        // Hide warning if it's showing
        if (this.isWarningShown) {
            this.hideWarningModal();
        }
        
        // Reset the inactivity timer
        this.resetInactivityTimer();
    }
    
    /**
     * Reset the inactivity timer
     */
    resetInactivityTimer() {
        // Clear existing timers
        this.clearAutoLogoutTimers();
        
        // Set warning timer (30 seconds before logout)
        this.warningTimeoutId = setTimeout(() => {
            this.showWarningModal();
        }, this.inactivityTimeout - this.warningTimeout);
        
        // Set logout timer
        this.timeoutId = setTimeout(() => {
            this.performAutoLogout();
        }, this.inactivityTimeout);
    }
    
    /**
     * Clear all auto-logout timers
     */
    clearAutoLogoutTimers() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        if (this.warningTimeoutId) {
            clearTimeout(this.warningTimeoutId);
            this.warningTimeoutId = null;
        }
    }
    
    /**
     * Show warning modal before auto-logout
     */
    showWarningModal() {
        if (this.isWarningShown) {
            return;
        }
        
        this.isWarningShown = true;
        
        // Create warning modal
        const modal = document.createElement('div');
        modal.id = 'auto-logout-warning';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 opacity-0 shadow-2xl">
                <div class="text-center">
                    <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Session Timeout Warning</h3>
                    <p class="text-gray-600 mb-6 leading-relaxed">
                        You will be automatically logged out in <span id="countdown-timer" class="font-bold text-red-600">30</span> seconds due to inactivity.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <button id="stay-logged-in" class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                            <i class="fas fa-check mr-2"></i>Stay Logged In
                        </button>
                        <button id="logout-now" class="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors">
                            <i class="fas fa-sign-out-alt mr-2"></i>Logout Now
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
        
        // Start countdown
        this.startCountdown();
        
        // Add event listeners
        document.getElementById('stay-logged-in').addEventListener('click', () => {
            this.stayLoggedIn();
        });
        
        document.getElementById('logout-now').addEventListener('click', () => {
            this.logout();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.stayLoggedIn();
            }
        });
    }
    
    /**
     * Hide warning modal
     */
    hideWarningModal() {
        const modal = document.getElementById('auto-logout-warning');
        if (modal) {
            const modalContent = modal.querySelector('.bg-white');
            modalContent.classList.add('scale-95', 'opacity-0');
            
            setTimeout(() => {
                modal.remove();
            }, 300);
            
            this.isWarningShown = false;
        }
    }
    
    /**
     * Start countdown timer in warning modal
     */
    startCountdown() {
        let timeLeft = 30;
        const countdownElement = document.getElementById('countdown-timer');
        
        const countdownInterval = setInterval(() => {
            timeLeft--;
            if (countdownElement) {
                countdownElement.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        // Store interval ID for cleanup
        this.countdownInterval = countdownInterval;
    }
    
    /**
     * User chooses to stay logged in
     */
    stayLoggedIn() {
        // Clear countdown interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        // Hide warning modal
        this.hideWarningModal();
        
        // Update activity and reset timer
        this.updateActivity();
        
        // Show success message
        this.showNotification('Session extended successfully!', 'success');
    }
    
    /**
     * Perform automatic logout
     */
    performAutoLogout() {
        // Clear countdown interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        // Hide warning modal if still showing
        this.hideWarningModal();
        
        // Show logout notification
        this.showNotification('You have been automatically logged out due to inactivity.', 'warning');
        
        // Perform logout after a short delay
        setTimeout(() => {
            this.logout();
        }, 1000);
    }
    
    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
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
     * Get remaining session time in seconds
     */
    getRemainingSessionTime() {
        if (!this.isAuthenticated()) {
            return 0;
        }
        
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        const remainingTime = this.inactivityTimeout - timeSinceLastActivity;
        
        return Math.max(0, Math.floor(remainingTime / 1000));
    }
    
    /**
     * Manually extend session (useful for long operations)
     */
    extendSession() {
        this.updateActivity();
        this.showNotification('Session extended successfully!', 'success');
    }
    
    /**
     * Register an active session for a user
     */
    async registerActiveSession(userId, sessionId) {
        try {
            const activeSessions = await this.getActiveSessions();
            
            if (!activeSessions[userId]) {
                activeSessions[userId] = [];
            }
            
            // Add new session
            activeSessions[userId].push({
                sessionId: sessionId,
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            });
            
            await this.saveActiveSessions(activeSessions);
        } catch (error) {
            console.error('Error registering active session:', error);
        }
    }
    
    /**
     * Remove an active session for a user
     */
    async removeActiveSession(userId, sessionId) {
        try {
            const activeSessions = await this.getActiveSessions();
            
            if (activeSessions[userId]) {
                activeSessions[userId] = activeSessions[userId].filter(
                    session => session.sessionId !== sessionId
                );
                
                // If no more sessions, remove user entry
                if (activeSessions[userId].length === 0) {
                    delete activeSessions[userId];
                }
                
                await this.saveActiveSessions(activeSessions);
            }
        } catch (error) {
            console.error('Error removing active session:', error);
        }
    }
    
    /**
     * Check if a session is still active
     */
    async isSessionActive(userId, sessionId) {
        try {
            const activeSessions = await this.getActiveSessions();
            
            if (!activeSessions[userId]) {
                return false;
            }
            
            return activeSessions[userId].some(
                session => session.sessionId === sessionId
            );
        } catch (error) {
            console.error('Error checking session status:', error);
            return false;
        }
    }
    
    /**
     * Logout all other devices for a user
     */
    async logoutOtherDevices(userId) {
        try {
            const activeSessions = await this.getActiveSessions();
            
            if (activeSessions[userId] && activeSessions[userId].length > 0) {
                // Clear all existing sessions for this user
                activeSessions[userId] = [];
                await this.saveActiveSessions(activeSessions);
                
                // Show notification about other devices being logged out
                this.showNotification(
                    'You have been logged out from other devices for security.',
                    'info'
                );
            }
        } catch (error) {
            console.error('Error logging out other devices:', error);
        }
    }
    
    /**
     * Get all active sessions
     */
    async getActiveSessions() {
        try {
            // Check if Upstash is available
            if (!window.UPSTASH_CONFIG || !window.UPSTASH_CONFIG.apiBase) {
                return this.getLocalStorageActiveSessions();
            }
            
            const result = await upstashRequest('get', [this.activeSessionsKey]);
            
            if (!result) {
                return {};
            }
            
            return typeof result === 'string' ? JSON.parse(result) : result;
        } catch (error) {
            return this.getLocalStorageActiveSessions();
        }
    }
    
    /**
     * Save active sessions
     */
    async saveActiveSessions(activeSessions) {
        try {
            // Check if Upstash is available
            if (!window.UPSTASH_CONFIG || !window.UPSTASH_CONFIG.apiBase) {
                this.saveLocalStorageActiveSessions(activeSessions);
                return;
            }
            
            await upstashRequest('set', [this.activeSessionsKey, JSON.stringify(activeSessions)]);
        } catch (error) {
            this.saveLocalStorageActiveSessions(activeSessions);
        }
    }
    
    /**
     * Get active sessions from localStorage (fallback)
     */
    getLocalStorageActiveSessions() {
        try {
            const sessions = localStorage.getItem('travelbook_active_sessions_fallback');
            return sessions ? JSON.parse(sessions) : {};
        } catch (error) {
            return {};
        }
    }
    
    /**
     * Save active sessions to localStorage (fallback)
     */
    saveLocalStorageActiveSessions(activeSessions) {
        localStorage.setItem('travelbook_active_sessions_fallback', JSON.stringify(activeSessions));
    }
    
    /**
     * Get active sessions for a specific user (admin function)
     */
    async getUserActiveSessions(userId) {
        try {
            const activeSessions = await this.getActiveSessions();
            return activeSessions[userId] || [];
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Force logout a specific user from all devices (admin function)
     */
    async forceLogoutUser(userId) {
        try {
            const activeSessions = await this.getActiveSessions();
            
            if (activeSessions[userId]) {
                delete activeSessions[userId];
                await this.saveActiveSessions(activeSessions);
                
                this.showNotification(
                    `User ${userId} has been logged out from all devices.`,
                    'success'
                );
            }
        } catch (error) {
            console.error('Error force logging out user:', error);
        }
    }
    
    /**
     * Clean up expired sessions (maintenance function)
     */
    async cleanupExpiredSessions() {
        try {
            const activeSessions = await this.getActiveSessions();
            const now = new Date();
            let hasChanges = false;
            
            for (const userId in activeSessions) {
                if (activeSessions[userId]) {
                    const validSessions = activeSessions[userId].filter(session => {
                        const sessionDate = new Date(session.createdAt);
                        const sessionAge = now - sessionDate;
                        return sessionAge < this.sessionDuration;
                    });
                    
                    if (validSessions.length !== activeSessions[userId].length) {
                        activeSessions[userId] = validSessions;
                        hasChanges = true;
                    }
                    
                    // Remove user entry if no valid sessions
                    if (activeSessions[userId].length === 0) {
                        delete activeSessions[userId];
                        hasChanges = true;
                    }
                }
            }
            
            if (hasChanges) {
                await this.saveActiveSessions(activeSessions);
            }
        } catch (error) {
            console.error('Error cleaning up expired sessions:', error);
        }
    }
}

// Create global instance
window.authManager = new AuthManager();
