import { MarketItem } from '../types';
import { db, storage } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const MARKET_ITEMS_COLLECTION = 'market-items';

export const marketService = {
    getItems: async (): Promise<MarketItem[]> => {
        try {
            const itemsCollection = collection(db, MARKET_ITEMS_COLLECTION);
            const q = query(itemsCollection, orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);
            
            const items: MarketItem[] = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() } as MarketItem);
            });
            return items;
        } catch (e) {
            console.error("Error fetching market items:", e);
            return [];
        }
    },

    addItem: async (item: Omit<MarketItem, 'id' | 'timestamp' | 'imageUrl'>, imageFile: File): Promise<MarketItem> => {
        try {
            // 1. Upload image to Firebase Storage
            const imageRef = ref(storage, `${MARKET_ITEMS_COLLECTION}/${Date.now()}-${imageFile.name}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(snapshot.ref);

            // 2. Add item data to Firestore
            const newItemData = {
                ...item,
                imageUrl,
                timestamp: Date.now(),
            };
            const docRef = await addDoc(collection(db, MARKET_ITEMS_COLLECTION), newItemData);
            
            return { id: docRef.id, ...newItemData };

        } catch (error) {
            console.error("Failed to add market item:", error);
            throw error;
        }
    },

    deleteItem: async (itemId: string, userId: string): Promise<boolean> => {
        try {
            const itemDocRef = doc(db, MARKET_ITEMS_COLLECTION, itemId);
            const itemDoc = await getDoc(itemDocRef);

            if (!itemDoc.exists()) {
                console.warn(`Item ${itemId} not found.`);
                return false;
            }
            
            const itemData = itemDoc.data() as MarketItem;
            
            if (itemData.sellerId !== userId) {
                console.warn(`User ${userId} is not the owner of item ${itemId}.`);
                return false;
            }

            // 1. Delete image from Firebase Storage
            if (itemData.imageUrl) {
                try {
                    const imageRef = ref(storage, itemData.imageUrl);
                    await deleteObject(imageRef);
                } catch (storageError: any) {
                    // It's possible the image doesn't exist, so we log but don't fail the whole operation
                     if (storageError.code !== 'storage/object-not-found') {
                        console.error("Error deleting image from storage, but proceeding with Firestore deletion:", storageError);
                    }
                }
            }

            // 2. Delete item from Firestore
            await deleteDoc(itemDocRef);
            return true;

        } catch (error) {
            console.error(`Failed to delete item ${itemId}:`, error);
            return false;
        }
    },
};
