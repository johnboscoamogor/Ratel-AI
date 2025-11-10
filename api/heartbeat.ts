import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Standard server-side environment variables for Vercel.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        // This is a server configuration error.
        return res.status(500).json({ status: "error", message: "Supabase environment variables are not configured on the server." });
    }

    try {
        // Use the Supabase client for a more robust health check.
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // getSession is a lightweight way to verify credentials and connectivity.
        const { error } = await supabase.auth.getSession();

        if (error) {
            // If getSession returns an error, something is wrong with the connection or credentials.
            throw error;
        }

        // Uptime monitors often use HEAD requests.
        if (req.method === 'HEAD') {
            return res.status(200).end();
        }

        // For GET requests, provide a meaningful JSON response.
        return res.status(200).json({
            status: "ok",
            message: "💓 Supabase connection is active."
        });

    } catch (error: any) {
        console.error("Heartbeat check failed:", error.message);

        if (req.method === 'HEAD') {
            return res.status(503).end(); // 503 Service Unavailable is appropriate for a failed dependency.
        }

        return res.status(503).json({ status: "error", message: `Supabase connection failed: ${error.message}` });
    }
}
