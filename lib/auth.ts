import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase-config';

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err: any) {
    console.error("Google sign-in error:", err);
    // Handle specific errors if needed
    if (err.code === 'auth/popup-closed-by-user') {
      return;
    }
    if (err.code === 'auth/account-exists-with-different-credential') {
        alert("חשבון כבר קיים עם אמצעי אימות אחר.");
        return;
    }
    alert(`התחברות עם Google נכשלה. נסה שוב.`);
  }
};

export const signInAsGuest = async () => {
  try {
    await signInAnonymously(auth);
  } catch (err) {
    console.error("Anonymous sign-in error:", err);
    alert("התחברות כאורח נכשלה. נסה שוב.");
  }
};
