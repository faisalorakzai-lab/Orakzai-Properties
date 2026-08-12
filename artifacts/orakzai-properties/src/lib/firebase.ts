import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyCYZF_WWCMR3KDIevQyrMUU7FSmV5d7oXw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "orakzai-properties.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "orakzai-properties",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "orakzai-properties.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "620605520438",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:620605520438:web:2a07d881dc3d69dc403697",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-WF4E74PNP3",
};

export const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});
