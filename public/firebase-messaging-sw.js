importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyDfoF5ThNLTDHMU2gbKl8EDcdALv13TMfg",
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

  const notificationTitle = payload.notification?.title || "Barista Mate";
  const notificationOptions = {
    body: payload.notification?.body || "תזכורת חדשה",
    icon: "/icon-192x192.png",
    // We can add a custom icon logic later if we upload PWA icons
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
