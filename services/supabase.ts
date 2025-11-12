import { createClient } from '@supabase/supabase-js';
import { MarketItem, MarketPayment, MobileWorker, UserProfile } from '../types';

// For Vercel deployments, Vite automatically handles `import.meta.env`.
// This is the standard and most reliable way to access frontend variables.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;


// This check determines if the credentials have been correctly configured from any environment source.
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

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
    }>(supabaseUrl!, supabaseAnonKey!);
} else {
    // This console warning will be shown in the browser's dev tools.
    // The user-facing guide is displayed in App.tsx.
    console.warn("Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.");
}

// Export the client instance (which can be null if not configured).
export const supabase = supabaseClient;