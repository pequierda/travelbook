/**
 * Upstash Configuration
 * Local development configuration with localStorage fallback
 */

const UPSTASH_CONFIG = {
    // Direct Upstash configuration for local development
    apiBase: 'https://api.upstash.com/v2/rest',
    
    // Your Upstash credentials (replace with your actual credentials)
    // You can get these from your Upstash dashboard
    url: 'YOUR_UPSTASH_REDIS_REST_URL', // Replace with your actual URL
    token: 'YOUR_UPSTASH_REDIS_REST_TOKEN', // Replace with your actual token
    
    // Fallback to localStorage for development
    useLocalStorage: true
};

// Helper function to make Upstash API calls
async function upstashRequest(command, args = []) {
    // For local development, use localStorage fallback
    if (UPSTASH_CONFIG.useLocalStorage) {
        return localStorageUpstashRequest(command, args);
    }
    
    // Direct Upstash API call (for production)
    const response = await fetch(`${UPSTASH_CONFIG.apiBase}/${command.toLowerCase()}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${UPSTASH_CONFIG.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            command: command.toUpperCase(),
            args: args
        })
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.result;
}

// LocalStorage fallback for development
function localStorageUpstashRequest(command, args = []) {
    const [key, ...otherArgs] = args;
    
    switch (command.toLowerCase()) {
        case 'hset':
            const [field, value] = otherArgs;
            const existingData = JSON.parse(localStorage.getItem(key) || '{}');
            existingData[field] = value;
            localStorage.setItem(key, JSON.stringify(existingData));
            return 1;
            
        case 'hget':
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return data[otherArgs[0]] || null;
            
        case 'hgetall':
            return JSON.parse(localStorage.getItem(key) || '{}');
            
        case 'hdel':
            const delData = JSON.parse(localStorage.getItem(key) || '{}');
            const fieldsToDelete = otherArgs;
            let deletedCount = 0;
            fieldsToDelete.forEach(field => {
                if (delData.hasOwnProperty(field)) {
                    delete delData[field];
                    deletedCount++;
                }
            });
            localStorage.setItem(key, JSON.stringify(delData));
            return deletedCount;
            
        case 'sadd':
            const setKey = key;
            const setData = JSON.parse(localStorage.getItem(setKey) || '[]');
            const newMembers = otherArgs.filter(member => !setData.includes(member));
            setData.push(...newMembers);
            localStorage.setItem(setKey, JSON.stringify(setData));
            return newMembers.length;
            
        case 'smembers':
            return JSON.parse(localStorage.getItem(key) || '[]');
            
        case 'srem':
            const sremKey = key;
            const sremData = JSON.parse(localStorage.getItem(sremKey) || '[]');
            const membersToRemove = otherArgs;
            const filteredData = sremData.filter(member => !membersToRemove.includes(member));
            localStorage.setItem(sremKey, JSON.stringify(filteredData));
            return sremData.length - filteredData.length;
            
        case 'set':
            localStorage.setItem(key, otherArgs[0]);
            return 'OK';
            
        case 'get':
            return localStorage.getItem(key);
            
        case 'del':
            localStorage.removeItem(key);
            return 1;
            
        case 'keys':
            const pattern = key;
            const allKeys = Object.keys(localStorage);
            if (pattern === '*') {
                return allKeys;
            }
            // Simple pattern matching
            return allKeys.filter(k => k.includes(pattern.replace('*', '')));
            
        default:
            throw new Error(`Unknown command: ${command}`);
    }
}

// Export for use in other files
window.UPSTASH_CONFIG = UPSTASH_CONFIG;
window.upstashRequest = upstashRequest;
