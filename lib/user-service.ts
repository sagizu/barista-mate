import { db } from '@/firebase-config';
import { doc, writeBatch, collection, getDocs } from 'firebase/firestore';

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