import { createClient } from '@supabase/supabase-js';
import { MarketItem, MarketPayment } from '../types';

// --- IMPORTANT SETUP ---
// You are almost there!
// I have filled in your Supabase URL below based on your screenshot.
// Now, just copy your 'anon' 'public' key from your Supabase dashboard and paste it
// into the supabaseAnonKey variable to replace the placeholder text.

const supabaseUrl = 'https://hmilzanpttpczbeezdwe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtaWx6YW5wdHRwY3piZWV6ZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzg2NzMsImV4cCI6MjA3NTgxNDY3M30.V7NpiSzi5GU9_ywL1BIKNuEL2hiA0slSdRmx5EngQcQ'; // <-- PASTE YOUR KEY HERE


// This check determines if the placeholder values have been updated.
export const isSupabaseConfigured = 
    !supabaseUrl.includes('YOUR_SUPABASE_URL_HERE') && 
    !supabaseAnonKey.includes('PASTE_YOUR_ANON_KEY_HERE');

// Conditionally create the Supabase client.
let supabaseClient = null;
if (isSupabaseConfigured) {
    // The generic type argument helps TypeScript understand the shape of your database tables.
    supabaseClient = createClient<{
        market_items: MarketItem;
        market_payments: MarketPayment;
    }>(supabaseUrl, supabaseAnonKey);
} else {
    // Log a warning to the developer console if Supabase is not configured.
    console.warn("Supabase is not configured. The Market Studio feature will not work until you update the keys in 'services/supabase.ts'.");
}

// Export the client instance (which can be null if not configured).
export const supabase = supabaseClient;
