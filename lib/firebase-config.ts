import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate required config - only throw errors on client side to prevent SSR issues
if (typeof window !== 'undefined' && (!firebaseConfig.apiKey || !firebaseConfig.projectId)) {
  console.error('Firebase config:', {
    apiKey: !!firebaseConfig.apiKey,
    projectId: !!firebaseConfig.projectId,
    authDomain: !!firebaseConfig.authDomain,
  });
  
  // Create a user-friendly error for missing config
  const missingFields = [];
  if (!firebaseConfig.apiKey) missingFields.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.projectId) missingFields.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  
  throw new Error(`Firebase configuration error: Missing environment variables: ${missingFields.join(', ')}`);
}

// Initialize Firebase only if we have the required config
let app: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } else {
    console.warn('Firebase not initialized: Missing required configuration');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { db, auth, storage };

// Analytics (only on client side and when available)
export const analytics = (() => {
  if (typeof window !== 'undefined' && app && firebaseConfig.measurementId) {
    try {
      const { getAnalytics } = require('firebase/analytics');
      return getAnalytics(app);
    } catch (error) {
      console.warn('Analytics not available:', error);
      return null;
    }
  }
  return null;
})();

export default app;