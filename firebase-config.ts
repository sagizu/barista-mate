// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "build-placeholder-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "localhost",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "barista-mate-build",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "barista-mate-build.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const hasValidApiKey = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith("AIza")
);
const auth = (typeof window !== "undefined" || hasValidApiKey
  ? getAuth(app)
  : ({} as ReturnType<typeof getAuth>));
const db = getFirestore(app);
const storage = getStorage(app);

let _messaging: ReturnType<typeof getMessaging> | null = null;

export async function getMessagingInstance(): Promise<ReturnType<typeof getMessaging> | null> {
  if (typeof window === "undefined") return null;
  if (_messaging) return _messaging;
  const supported = await isSupported();
  if (supported) {
    _messaging = getMessaging(app);
  }
  return _messaging;
}

// Keep a synchronous export for backward compatibility (may be null on first render)
export { app, auth, db, storage };
export const messaging = _messaging;
