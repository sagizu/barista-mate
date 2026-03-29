import { messaging } from "../firebase-config";
import { getToken } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";

export const requestNotificationPermission = async (userId: string): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      if (!messaging) {
        console.error("Firebase messaging is not initialized. Make sure you are using an HTTPS connection or localhost.");
        return false;
      }

      // Generate the push token
      // NOTE: You need to specify a VAPID key in production if you enforce web push identity.
      const currentToken = await getToken(messaging, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY // optional fallback
      });
      
      if (currentToken) {
        console.log("FCM Token acquired.");
        // Save the token to the user document in firestore
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          pushToken: currentToken
        });
        return true;
      } else {
        console.log("No registration token available. Request permission to generate one.");
        return false;
      }
    } else {
      console.log("Notification permission not granted.");
      return false;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token. ", error);
    return false;
  }
};
