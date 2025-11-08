import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function checks the health of the Supabase connection.
// It's designed to be used by uptime monitoring services.

// Standard server-side environment variables for Vercel.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        // This is a server configuration error.
        return res.status(500).json({ status: "error", message: "Supabase environment variables are not configured on the server." });
    }

    try {
        // Use fetch with HEAD method to check the connection without transferring the body.
        // This is more efficient for a simple health check.
        const ping = await fetch(`${SUPABASE_URL}/rest/v1/`, { 
            method: "HEAD", 
            headers: { 
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}` // Required for some Supabase project configurations
            }
        });
        
        // Uptime monitors often use HEAD requests and don't expect a response body.
        // We handle this case specifically for compatibility.
        if (req.method === 'HEAD') {
            return res.status(ping.ok ? 200 : 503).end(); // 503 Service Unavailable is appropriate for a failed dependency.
        }

        // For GET requests, provide a meaningful JSON response.
        return res.status(ping.ok ? 200 : 503).json({
            status: ping.ok ? "ok" : "error",
            message: ping.ok ? "💓 Supabase connection is active." : `❌ Supabase connection failed with status: ${ping.status}`
        });

    } catch (error: any) {
        console.error("Heartbeat check failed:", error);

        if (req.method === 'HEAD') {
            return res.status(503).end();
        }

        return res.status(503).json({ status: "error", message: error.message });
    }
}
