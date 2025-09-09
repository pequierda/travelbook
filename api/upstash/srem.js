/**
 * Vercel API Route: Upstash SREM command
 * Securely handles Redis SREM operations using environment variables
 */

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
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
        const response = await fetch(`${upstashUrl}/srem/${args[0]}/${encodeURIComponent(args[1])}`, {
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
        console.error('Upstash SREM error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}
