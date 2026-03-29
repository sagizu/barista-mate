import * as admin from 'firebase-admin';

const initApp = () => {
  if (admin.apps.length > 0) return admin.app();

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn("FIREBASE_SERVICE_ACCOUNT is missing. Bypassing admin initialization for build trace.");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  } catch (error) {
    console.error('Firebase Admin init error', error);
    return null;
  }
};

const app = initApp();

export const adminDb = (app ? admin.firestore(app) : null) as admin.firestore.Firestore;
export const adminMessaging = (app ? admin.messaging(app) : null) as admin.messaging.Messaging;
export const adminAuth = (app ? admin.auth(app) : null) as admin.auth.Auth;
