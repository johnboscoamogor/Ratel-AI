import { createClient } from '@supabase/supabase-js';
import { MarketItem, MarketPayment, MobileWorker, UserProfile } from '../types';

// --- TYPE DEFINITIONS FOR PROCESS.ENV ---
// This informs TypeScript about the custom environment variables.
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            VITE_SUPABASE_URL: string;
            VITE_SUPABASE_ANON_KEY: string;
        }
    }
}

// --- IMPORTANT SETUP ---
// These variables should be set in your Vercel Environment Variables.
// On your local machine, you can create a .env.local file to store them.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;


// This check determines if the environment variables have been set.
export const isSupabaseConfigured = 
    supabaseUrl && supabaseUrl.trim() !== '' && 
    supabaseAnonKey && supabaseAnonKey.trim() !== '';

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
    // Log a warning to the developer console if Supabase is not configured.
    console.warn("Supabase is not configured. The Market Studio and Mobile Worker features will not work until you set the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.");
}

// Export the client instance (which can be null if not configured).
export const supabase = supabaseClient;