import { createClient } from '@supabase/supabase-js';
import { MarketItem, MarketPayment, MobileWorker, UserProfile } from '../types';

// --- IMPORTANT SETUP ---
// The Supabase credentials have been set below.
const supabaseUrl = 'https://hmilzanpttpczbeezdwe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtaWx6YW5wdHRwY3piZWV6ZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzg2NzMsImV4cCI6MjA3NTgxNDY3M30.V7NpiSzi5GU9_ywL1BIKNuEL2hiA0slSdRmx5EngQcQ';

// This check determines if the credentials are valid.
export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// A profile type that matches the new database table structure
type Profile = Omit<UserProfile, 'email'> & { id: string };

// Conditionally create the Supabase client.
let supabaseClient = null;
if (isSupabaseConfigured) {
    // The generic type argument helps TypeScript understand the shape of your database tables.
    supabaseClient = createClient<{
        market_items: MarketItem;
        market_payments: MarketPayment;
        mobile_workers: MobileWorker;
        profiles: Profile;
    }>(supabaseUrl, supabaseAnonKey);
} else {
    // Log a prominent warning to the developer console if credentials are not set.
    console.error("CRITICAL: Supabase credentials are not set in 'services/supabase.ts'. Please update the placeholder values for authentication to work.");
}

// Export the client instance (which can be null if not configured).
export const supabase = supabaseClient;
