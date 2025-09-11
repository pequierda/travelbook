/**
 * Upstash Configuration
 * Uses Vercel API routes for secure database access
 */

const UPSTASH_CONFIG = {
    // Use Vercel API routes instead of direct Upstash calls
    apiBase: '/api/upstash',
    
    // API endpoints
    endpoints: {
        set: '/set',
        get: '/get',
        del: '/del',
        keys: '/keys',
        hset: '/hset',
        hget: '/hget',
        hgetall: '/hgetall',
        hdel: '/hdel',
        sadd: '/sadd',
        smembers: '/smembers',
        srem: '/srem'
    }
};

// Helper function to make Upstash API calls through Vercel API routes
async function upstashRequest(command, args = []) {
    const endpoint = UPSTASH_CONFIG.endpoints[command.toLowerCase()];
    if (!endpoint) {
        throw new Error(`Unknown command: ${command}`);
    }
    
    const url = `${UPSTASH_CONFIG.apiBase}${endpoint}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
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
    
    if (!data.success) {
        throw new Error(data.message || 'API request failed');
    }
    
    return data.result;
}

// Export for use in other files
window.UPSTASH_CONFIG = UPSTASH_CONFIG;
window.upstashRequest = upstashRequest;
