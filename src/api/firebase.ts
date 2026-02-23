import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
    browserLocalPersistence,
    // @ts-expect-error - getReactNativePersistence is available at runtime but missing from standard types
    getReactNativePersistence,
    initializeAuth
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Persistence configuration
const persistence = Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence ? getReactNativePersistence(AsyncStorage) : undefined;

export const auth = initializeAuth(app, {
    persistence
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
