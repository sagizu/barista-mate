
import { auth, db } from "@/firebase-config";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, arrayUnion, query, where, getDocs, arrayRemove } from "firebase/firestore";
import type { SavedBean, MaintenanceDates, GeneralSettings, DialInRecord } from "./types";

const getBeansCollection = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return collection(db, "users", user.uid, "beans");
}

const getPrivateRoastersDocRef = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return doc(db, "users", user.uid, "roasters", "private");
};

// Add a new bean
export const addBean = async (beanData: Omit<SavedBean, 'id' | 'createdAt'>) => {
    const beansCollection = getBeansCollection();
    return await addDoc(beansCollection, {
        ...beanData,
        createdAt: serverTimestamp()
    });
};

// Update an existing bean
export const updateBean = async (id: string, updates: Partial<Omit<SavedBean, 'id'>>) => {
    const beansCollection = getBeansCollection();
    const beanRef = doc(beansCollection, id);
    return await updateDoc(beanRef, updates);
};

// Delete a bean
export const deleteBean = async (id: string) => {
    const beansCollection = getBeansCollection();
    const beanRef = doc(beansCollection, id);
    return await deleteDoc(beanRef);
};

// Update maintenance dates
export const updateMaintenanceDates = async (updates: Partial<MaintenanceDates>) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const maintenanceRef = doc(db, 'users', user.uid, 'maintenance', 'log');
    // Using set with merge to create the document if it doesn't exist, or update it if it does.
    return await setDoc(maintenanceRef, updates, { merge: true });
};

// Update general settings
export const updateGeneralSettings = async (updates: Partial<GeneralSettings>) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
    return await setDoc(settingsRef, updates, { merge: true });
};

// Add a dial-in record
export const addDialInRecord = async (record: Omit<DialInRecord, 'createdAt'>) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const logsCollection = collection(db, "users", user.uid, "logs");
    return await addDoc(logsCollection, {
        ...record,
        createdAt: serverTimestamp()
    });
};

export const addPrivateRoaster = async (roasterName: string) => {
    const privateRoastersDocRef = getPrivateRoastersDocRef();
    return await setDoc(privateRoastersDocRef, {
        names: arrayUnion(roasterName)
    }, { merge: true });
};

export const getPrivateRoasters = async (): Promise<string[]> => {
    const privateRoastersDocRef = getPrivateRoastersDocRef();
    const docSnap = await getDoc(privateRoastersDocRef);
    if (docSnap.exists()) {
        return docSnap.data().names || [];
    }
    return [];
};

export const getBeansByRoaster = async (roasterName: string): Promise<SavedBean[]> => {
    const beansCollection = getBeansCollection();
    const q = query(beansCollection, where("roasterName", "==", roasterName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedBean));
}

export const deletePrivateRoaster = async (roasterName: string) => {
    const beans = await getBeansByRoaster(roasterName);
    if (beans.length > 0) {
        throw new Error(`לא ניתן למחוק את בית הקלייה "${roasterName}" מאחר ויש לו פולים משויכים.`);
    }

    const privateRoastersDocRef = getPrivateRoastersDocRef();
    return await updateDoc(privateRoastersDocRef, {
        names: arrayRemove(roasterName)
    });
};
