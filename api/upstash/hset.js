/**
 * Vercel API Route: Upstash HSET command
 * Securely handles Redis HSET operations using environment variables
 */

module.exports = async function handler(req, res) {
    // Set CORS headers with allowlist
    const allowlist = (process.env.ORIGIN_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);
    const origin = req.headers.origin || '';
    if (allowlist.length && origin && !allowlist.includes(origin)) {
        return res.status(403).json({ success: false, message: 'Forbidden origin' });
    }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Optional API key check
    const apiKey = process.env.INTERNAL_API_KEY;
    if (apiKey && req.headers['x-internal-api-key'] !== apiKey) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    try {
        const { command, args } = req.body;

        // Validate request
        if (!command || !args || !Array.isArray(args)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request format'
            });
        }

        // Get Upstash credentials from environment variables
        const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
        const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!upstashUrl || !upstashToken) {
            return res.status(500).json({
                success: false,
                message: 'Upstash configuration not found'
            });
        }

        // Make request to Upstash (using the correct REST API format)
        const response = await fetch(`${upstashUrl}/hset/${args[0]}/${args[1]}/${encodeURIComponent(args[2])}`, {
            headers: { 
                'Authorization': `Bearer ${upstashToken}` 
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Upstash API error: ${response.status}`);
        }

        const data = await response.json();

        return res.status(200).json({
            success: true,
            result: data.result
        });

    } catch (error) {
        console.error('Upstash HSET error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}
