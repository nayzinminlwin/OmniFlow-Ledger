import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

const requiredEnvVars = {
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_FIRESTORE_DATABASE_ID: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const firebaseConfig = {
  projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID,
  appId: requiredEnvVars.VITE_FIREBASE_APP_ID,
  apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY,
  authDomain: requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: requiredEnvVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredEnvVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firestoreDatabaseId = requiredEnvVars.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Modern way to enable offline persistence with multi-tab support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firestoreDatabaseId);
