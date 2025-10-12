/**
 * NOTE: The Firebase dependency has been temporarily disabled to address setup issues.
 * The Market Studio feature will now use the browser's localStorage for a seamless
 * development experience without needing a Firebase project.
 *
 * To re-enable Firebase in the future:
 * 1. Resolve your Firebase/Google Cloud project setup.
 * 2. Ensure your .env variables for Firebase are correct.
 * 3. Uncomment the code below.
 * 4. Revert the changes in `services/marketService.ts` to use the Firebase implementation.
 */

// import { initializeApp } from 'firebase/app';
// import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
// import { getStorage, connectStorageEmulator } from 'firebase/storage';

// const firebaseConfig = {
//   apiKey: process.env.FIREBASE_API_KEY,
//   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.FIREBASE_PROJECT_ID,
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.FIREBASE_APP_ID
// };

// const app = initializeApp(firebaseConfig);

// const db = getFirestore(app);
// const storage = getStorage(app);

// if (process.env.USE_EMULATOR === 'true') {
//   console.log('Using Firebase Local Emulators');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
// }

// export { db, storage };

// Export dummy objects to prevent potential import errors in other files.
export const db = {};
export const storage = {};
