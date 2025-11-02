// FIX: The triple-slash directive for Vite's client types was causing an error in some environments.
// It has been removed and `import.meta` is now cast to `any` to resolve related TypeScript errors.

import { createClient } from '@supabase/supabase-js';
import { MarketItem, MarketPayment, MobileWorker, UserProfile } from '../types';

// --- IMPORTANT SETUP ---
// These variables should be set in your Vercel Environment Variables.
// On your local machine, you can create a .env.local file to store them.
// FIX: Cast `import.meta` to `any` to access environment variables without Vite client types, resolving "Property 'env' does not exist" error.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://hmilzanpttpczbeezdwe.supabase.co';
// FIX: Cast `import.meta` to `any` to access environment variables without Vite client types, resolving "Property 'env' does not exist" error.
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtaWx6YW5wdHRwY3piZWV6ZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzg2NzMsImV4cCI6MjA3NTgxNDY3M30.V7NpiSzi5GU9_ywL1BIKNuEL2hiA0slSdRmx5EngQcQ';


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