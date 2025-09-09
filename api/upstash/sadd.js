/**
 * Vercel API Route: Upstash SADD command
 * Securely handles Redis SADD operations using environment variables
 */

module.exports = async function handler(req, res) {
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

        // Make request to Upstash
        const response = await fetch(`${upstashUrl}/sadd`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${upstashToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                command: command.toUpperCase(),
                args: args
            })
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
        console.error('Upstash SADD error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}
