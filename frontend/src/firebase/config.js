import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGg_xg-d5mOt1OYnT5_2yc1hDvvl31uo0",
  authDomain: "shef-lms-6b3af.firebaseapp.com",
  projectId: "shef-lms-6b3af",
  storageBucket: "shef-lms-6b3af.firebasestorage.app",
  messagingSenderId: "84106887120",
  appId: "1:84106887120:web:b680dc724c465f3a5dc3d5",
  measurementId: "G-FDTLC6VH47"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
