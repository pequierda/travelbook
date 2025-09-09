/**
 * Upstash Configuration
 * Replace these with your actual Upstash credentials
 */

const UPSTASH_CONFIG = {
    // Your Upstash Redis REST API URL
    url: 'https://your-endpoint.upstash.io',
    
    // Your Upstash Redis REST API Token
    token: 'your-upstash-token',
    
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

// Helper function to make Upstash API calls
async function upstashRequest(command, args = []) {
    const endpoint = UPSTASH_CONFIG.endpoints[command.toLowerCase()];
    if (!endpoint) {
        throw new Error(`Unknown command: ${command}`);
    }
    
    const url = `${UPSTASH_CONFIG.url}${endpoint}`;
    
    const response = await fetch(url, {
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
        throw new Error(`Upstash API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.result;
}

// Export for use in other files
window.UPSTASH_CONFIG = UPSTASH_CONFIG;
window.upstashRequest = upstashRequest;
