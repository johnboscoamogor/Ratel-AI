import { createClient } from '@supabase/supabase-js';
import { MarketItem, MarketPayment, MobileWorker, UserProfile } from '../types';

// This robust check works for both Vercel (import.meta.env) and local AI Studio (process.env).
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;


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
    console.error("Supabase is not configured. Authentication will not work.");
}

// Export the client instance (which can be null if not configured).
export const supabase = supabaseClient;