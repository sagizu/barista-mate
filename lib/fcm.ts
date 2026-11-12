import { getMessagingInstance, db } from "../firebase-config";
import { getToken, deleteToken, onMessage } from "firebase/messaging";
import { doc, setDoc, updateDoc, deleteField, arrayUnion, arrayRemove } from "firebase/firestore";

export const getOrRegisterServiceWorker = async (): Promise<ServiceWorkerRegistration | undefined> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return undefined;
  }
  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    registration.update?.().catch(() => {});
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return undefined;
  }
};

const buildTokenOptions = (swRegistration?: ServiceWorkerRegistration) => {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  return {
    ...(vapidKey ? { vapidKey } : {}),
    ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {}),
  };
};

export const requestNotificationPermission = async (userId: string): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted.");
      return false;
    }

    const messagingInstance = await getMessagingInstance();
    if (!messagingInstance) {
      console.error("Firebase messaging is not initialized. Make sure you are using an HTTPS connection or localhost.");
      return false;
    }

    const swRegistration = await getOrRegisterServiceWorker();
    const currentToken = await getToken(messagingInstance, buildTokenOptions(swRegistration));

    if (currentToken) {
      console.log("FCM Token acquired.");
      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          pushToken: currentToken,
          pushTokens: arrayUnion(currentToken),
        },
        { merge: true }
      );
      return true;
    } else {
      console.log("No registration token available. Request permission to generate one.");
      return false;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token. ", error);
    return false;
  }
};

export const syncPushTokenIfPermitted = async (userId: string): Promise<string | null> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  if (Notification.permission !== "granted") {
    return null;
  }

  try {
    const messagingInstance = await getMessagingInstance();
    if (!messagingInstance) return null;

    const swRegistration = await getOrRegisterServiceWorker();
    const currentToken = await getToken(messagingInstance, buildTokenOptions(swRegistration));

    if (currentToken) {
      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          pushToken: currentToken,
          pushTokens: arrayUnion(currentToken),
        },
        { merge: true }
      );
      return currentToken;
    }
    return null;
  } catch (error) {
    console.error("Error syncing FCM token:", error);
    return null;
  }
};

export const disableNotificationPermission = async (userId: string): Promise<void> => {
  const userRef = doc(db, "users", userId);

  try {
    const messagingInstance = await getMessagingInstance();
    if (messagingInstance && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const swRegistration = await getOrRegisterServiceWorker();
        const currentToken = await getToken(messagingInstance, buildTokenOptions(swRegistration));
        if (currentToken) {
          await updateDoc(userRef, {
            pushToken: deleteField(),
            pushTokens: arrayRemove(currentToken),
          });
          await deleteToken(messagingInstance).catch(() => {});
          return;
        }
      } catch {
        // Fallback below if token lookup fails
      }
    }
  } catch {
    // Fallback below
  }

  await updateDoc(userRef, {
    pushToken: deleteField(),
    pushTokens: deleteField(),
  });
};

export const displaySystemNotification = async (
  title: string,
  body: string,
  url: string = "/",
  tag: string = "barista-mate-notification"
): Promise<boolean> => {
  if (typeof window === "undefined" || typeof Notification === "undefined" || Notification.permission !== "granted") {
    return false;
  }
  const icon = "/icon-192.png";
  try {
    if ("serviceWorker" in navigator) {
      const registration =
        (await navigator.serviceWorker.getRegistration()) ||
        (await getOrRegisterServiceWorker());
      if (registration && typeof registration.showNotification === "function") {
        await registration.showNotification(title, {
          body,
          icon,
          badge: "/icon-192.png",
          dir: "rtl",
          lang: "he",
          tag,
          data: { url },
        });
        return true;
      }
    }
    new Notification(title, {
      body,
      icon,
      tag,
    });
    return true;
  } catch (err) {
    console.error("Failed to display system notification:", err);
    return false;
  }
};

export const setupForegroundMessageHandler = async () => {
  if (typeof window === "undefined") return () => {};
  const messagingInstance = await getMessagingInstance();
  if (!messagingInstance) return () => {};

  if ("Notification" in window && Notification.permission === "granted") {
    getOrRegisterServiceWorker().catch(() => {});
  }

  return onMessage(messagingInstance, async (payload) => {
    console.log("Message received in foreground: ", payload);

    const title = payload.notification?.title || payload.data?.title || "תזכורת חדשה";
    const body = payload.notification?.body || payload.data?.body || "";
    const url = payload.data?.url || "/";

    await displaySystemNotification(title, body, url);
  });
};
