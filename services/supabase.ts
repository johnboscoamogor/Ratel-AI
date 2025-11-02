import { createClient } from '@supabase/supabase-js';
import { MarketItem, MarketPayment, MobileWorker, UserProfile } from '../types';

// FIX: Hardcoded credentials were missing quotes, causing a syntax error.
// They are now correctly formatted as strings.
const supabaseUrl = 'https://hmilzanpttpczbeezdwe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtaWx6YW5wdHRwY3piZWV6ZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzg2NzMsImV4cCI6MjA3NTgxNDY3M30.V7NpiSzi5GU9_ywL1BIKNuEL2hiA0slSdRmx5EngQcQ';


// This check determines if the credentials have been correctly configured from any environment source.
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
    // This error will be caught by App.tsx and a user-friendly guide will be displayed.
    console.error("Supabase credentials are not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
}

// Export the client instance (which can be null if not configured).
export const supabase = supabaseClient;