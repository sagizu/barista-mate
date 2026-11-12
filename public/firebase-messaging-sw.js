importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIza" + "SyDfoF5ThNLTDHMU2gbKl8EDcdALv13TMfg",
  authDomain: "coffee-social-app-e8dda.firebaseapp.com",
  projectId: "coffee-social-app-e8dda",
  storageBucket: "coffee-social-app-e8dda.firebasestorage.app",
  messagingSenderId: "156449817372",
  appId: "1:156449817372:web:829f666858c41410a530d9",
  measurementId: "G-N8686HS8SQ"
};

const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message: ", payload);

  // When a `notification` payload is present, the Firebase SDK automatically displays
  // the system notification on Android/Web. Only call showNotification manually
  // for data-only messages to avoid duplicate or dropped notifications.
  if (payload.notification) {
    return;
  }

  const notificationTitle = payload.data?.title || "Barista Mate";
  const notificationOptions = {
    body: payload.data?.body || "תזכורת חדשה",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    dir: "rtl",
    lang: "he",
    data: {
      url: payload.data?.url || "/",
    },
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
