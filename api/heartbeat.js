// api/heartbeat.js
export default async function handler(req, res) {
  try {
    // Replaced placeholders with your actual Supabase project credentials
    const response = await fetch('https://hmilzanpttpczbeezdwe.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtaWx6YW5wdHRwY3piZWV6ZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzg2NzMsImV4cCI6MjA3NTgxNDY3M30.V7NpiSzi5GU9_ywL1BIKNuEL2hiA0slSdRmx5EngQcQ',
      },
    });

    if (response.ok) {
      console.log('🟢 Supabase heartbeat sent successfully');
      return res.status(200).json({ success: true, message: 'Supabase heartbeat alive' });
    } else {
      console.log('🟡 Supabase responded with an error');
      return res.status(500).json({ success: false, message: 'Supabase response error' });
    }
  } catch (error) {
    console.error('🔴 Heartbeat failed:', error);
    return res.status(500).json({ success: false, message: 'Heartbeat failed', error });
  }
}
