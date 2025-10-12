import { MarketItem } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET_NAME = 'market-images';

// A reusable error message that guides the user to the solution.
const CONFIG_ERROR_MESSAGE = "Supabase not configured. Please update your URL and Key in 'services/supabase.ts'.";


export const marketService = {
    /**
     * Retrieves market items from the Supabase database.
     */
    getItems: async (): Promise<MarketItem[]> => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error(CONFIG_ERROR_MESSAGE);
        }

        const { data, error } = await supabase
            .from('market_items')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) {
            console.error("Error fetching market items:", error);
            throw error;
        }
        return data || [];
    },

    /**
     * Adds a new item by uploading its image to Storage and saving its data to the database.
     */
    addItem: async (item: Omit<MarketItem, 'id' | 'timestamp' | 'imageUrl'>, imageFile: File): Promise<MarketItem> => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error(CONFIG_ERROR_MESSAGE);
        }

        // 1. Upload the image file to Supabase Storage
        const fileExtension = imageFile.name.split('.').pop();
        const filePath = `${item.sellerId}/${Date.now()}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, imageFile);

        if (uploadError) {
            console.error("Error uploading image:", uploadError);
            throw uploadError;
        }

        // 2. Get the public URL of the uploaded image
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        const imageUrl = urlData.publicUrl;

        // 3. Insert the new item data (including the image URL) into the database
        const newItemData = {
            ...item,
            imageUrl,
            // id and timestamp are handled by the database
        };

        const { data: insertedData, error: insertError } = await supabase
            .from('market_items')
            .insert(newItemData)
            .select()
            .single();

        if (insertError) {
            console.error("Error inserting market item:", insertError);
            // Attempt to clean up the uploaded image if the database insert fails
            await supabase.storage.from(BUCKET_NAME).remove([filePath]);
            throw insertError;
        }

        return insertedData;
    },

    /**
     * Deletes an item from the database and its corresponding image from storage.
     */
    deleteItem: async (itemId: string, userId: string): Promise<boolean> => {
        if (!isSupabaseConfigured || !supabase) {
            throw new Error(CONFIG_ERROR_MESSAGE);
        }
        
        // 1. Fetch the item to verify ownership and get the image URL
        const { data: item, error: fetchError } = await supabase
            .from('market_items')
            .select('sellerId, imageUrl')
            .eq('id', itemId)
            .single();

        if (fetchError || !item) {
            console.error(`Error fetching item ${itemId} for deletion:`, fetchError);
            return false;
        }

        // 2. Check if the current user is the owner
        if (item.sellerId !== userId) {
            console.warn(`User ${userId} attempted to delete item ${itemId} owned by ${item.sellerId}.`);
            return false;
        }
        
        // 3. Delete the item from the database
        const { error: deleteError } = await supabase
            .from('market_items')
            .delete()
            .eq('id', itemId);

        if (deleteError) {
            console.error(`Error deleting item ${itemId} from database:`, deleteError);
            return false;
        }

        // 4. Delete the image from storage
        // Extract the file path from the full URL
        const imagePath = item.imageUrl.substring(item.imageUrl.lastIndexOf(BUCKET_NAME) + BUCKET_NAME.length + 1);
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([imagePath]);
            
        if (storageError) {
            // Log the error but consider the operation successful since the DB entry is gone
            console.error(`Failed to delete image ${imagePath} from storage, but DB entry was removed:`, storageError);
        }

        return true;
    },
};