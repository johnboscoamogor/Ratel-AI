// api/heartbeat.js
export default async function handler(req, res) {
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtaWx6YW5wdHRwY3piZWV6ZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzg2NzMsImV4cCI6MjA3NTgxNDY3M30.V7NpiSzi5GU9_ywL1BIKNuEL2hiA0slSdRmx5EngQcQ';
  try {
    const ping = await fetch("https://hmilzanpttpczbeezdwe.supabase.co/rest/v1/", { 
        method: "HEAD",
        headers: {
            apikey: supabaseAnonKey
        }
    });
    res.status(ping.ok ? 200 : 500).json({
      status: ping.ok ? "ok" : "error",
      message: ping.ok ? "💓 Supabase active" : `❌ Supabase connection failed with status: ${ping.status}`
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}
