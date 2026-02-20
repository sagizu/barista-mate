// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2gwSje22Z-3si5rGpd-llx2bXp95SeLk",
  authDomain: "coffee-social-app-e8dda.firebaseapp.com",
  projectId: "coffee-social-app-e8dda",
  storageBucket: "coffee-social-app-e8dda.firebasestorage.app",
  messagingSenderId: "156449817372",
  appId: "1:156449817372:web:829f666858c41410a530d9"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
