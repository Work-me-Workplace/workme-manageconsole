/**
 * Firebase Configuration
 * 
 * Frontend config values for Firebase client SDK
 * Environment variables take precedence over these defaults
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB3d_W-myVVR9LQbQNhTNrpo8IjzkdvaUw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "workme-management-console.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "workme-management-console",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "workme-management-console.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "371896227282",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:371896227282:web:6d96ab0ad30856e9e3a40b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SL7L2L00CT",
}

