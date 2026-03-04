import { db } from '@/firebase-config';
import { doc, writeBatch, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export const createUserDocument = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: serverTimestamp(),
    };

    try {
        await setDoc(userDocRef, userData, { merge: true });
    } catch (error) {
        console.error("Error creating user document:", error);
    }
};

export const deleteUserData = async (userId: string) => {
    const batch = writeBatch(db);
    
    // Delete documents from subcollections
    const subcollections = ['beans', 'settings', 'maintenance'];
    
    for (const subcol of subcollections) {
        const colRef = collection(db, 'users', userId, subcol);
        const snapshot = await getDocs(colRef);
        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
    }

    // Delete the user document itself
    const userDocRef = doc(db, 'users', userId);
    batch.delete(userDocRef);
    
    await batch.commit();
};
