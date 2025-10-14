import { MobileWorker } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET_NAME = 'worker-photos';
const CONFIG_ERROR_MESSAGE = "Supabase not configured. Please update your URL and Key in 'services/supabase.ts'.";

export const workerService = {
    /**
     * Retrieves mobile workers from Supabase, with optional filtering.
     */
    getWorkers: async (filters: { skill?: string, location?: string }): Promise<MobileWorker[]> => {
        if (!isSupabaseConfigured || !supabase) throw new Error(CONFIG_ERROR_MESSAGE);

        let query = supabase.from('mobile_workers').select('*').order('verified', { ascending: false }).order('created_at', { ascending: false });

        if (filters.skill) {
            query = query.eq('skill_category', filters.skill);
        }
        if (filters.location) {
            query = query.ilike('location', `%${filters.location}%`);
        }

        const { data, error } = await query;
        if (error) {
            console.error("Error fetching workers:", error.message);
            throw new Error(error.message);
        }
        return data || [];
    },

    /**
     * Adds a new worker by uploading their photo and saving data.
     */
    addWorker: async (worker: Omit<MobileWorker, 'id' | 'created_at' | 'profile_photo_url' | 'verified'>, photoFile: File): Promise<MobileWorker> => {
        if (!isSupabaseConfigured || !supabase) throw new Error(CONFIG_ERROR_MESSAGE);

        const fileExtension = photoFile.name.split('.').pop();
        const filePath = `${worker.user_id}/${Date.now()}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, photoFile);
        if (uploadError) {
            console.error("Error uploading photo:", uploadError.message);
            throw new Error(uploadError.message);
        }

        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        const profile_photo_url = urlData.publicUrl;

        const newWorkerData = { ...worker, profile_photo_url, verified: false };
        const { data: insertedData, error: insertError } = await supabase
            .from('mobile_workers')
            .insert(newWorkerData)
            .select()
            .single();

        if (insertError) {
            console.error("Error inserting worker:", insertError.message);
            await supabase.storage.from(BUCKET_NAME).remove([filePath]);
            throw new Error(insertError.message);
        }
        return insertedData;
    },

    /**
     * Retrieves all workers (for admin panel).
     */
    getAllWorkers: async (): Promise<MobileWorker[]> => {
        if (!isSupabaseConfigured || !supabase) throw new Error(CONFIG_ERROR_MESSAGE);
        const { data, error } = await supabase.from('mobile_workers').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching all workers:", error.message);
            throw new Error(error.message);
        }
        return data || [];
    },

    /**
     * Toggles the 'verified' status of a worker (admin only).
     */
    toggleVerifiedStatus: async (workerId: string, newStatus: boolean): Promise<MobileWorker | null> => {
        if (!isSupabaseConfigured || !supabase) throw new Error(CONFIG_ERROR_MESSAGE);

        const { data: updatedWorker, error } = await supabase
            .from('mobile_workers')
            .update({ verified: newStatus })
            .eq('id', workerId)
            .select()
            .single();

        if (error) {
            console.error(`Error updating verification for worker ${workerId}:`, error.message);
            throw new Error(error.message);
        }
        return updatedWorker;
    },
};