
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

const handleError = (error: any, operation: string) => {
    console.error(`Firestore operation "${operation}" failed`, error);
    if (error.code === 'permission-denied') {
        console.error("Firestore security rules denied the request.");
    }
    throw error; // Re-throw the error so UI can handle it
}

// Add a new bean
export const addBean = async (beanData: Omit<SavedBean, 'id' | 'createdAt'>) => {
    try {
        const beansCollection = getBeansCollection();
        return await addDoc(beansCollection, {
            ...beanData,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        handleError(error, 'addBean');
    }
};

// Update an existing bean
export const updateBean = async (id: string, updates: Partial<Omit<SavedBean, 'id'>>) => {
    try {
        const beansCollection = getBeansCollection();
        const beanRef = doc(beansCollection, id);
        return await updateDoc(beanRef, updates);
    } catch (error) {
        handleError(error, 'updateBean');
    }
};

// Delete a bean
export const deleteBean = async (id: string) => {
    try {
        const beansCollection = getBeansCollection();
        const beanRef = doc(beansCollection, id);
        return await deleteDoc(beanRef);
    } catch (error) {
        handleError(error, 'deleteBean');
    }
};

// Update maintenance dates
export const updateMaintenanceDates = async (updates: Partial<MaintenanceDates>) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        const maintenanceRef = doc(db, 'users', user.uid, 'maintenance', 'log');
        return await setDoc(maintenanceRef, updates, { merge: true });
    } catch (error) {
        handleError(error, 'updateMaintenanceDates');
    }
};

// Update general settings
export const updateGeneralSettings = async (updates: Partial<GeneralSettings>) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
        return await setDoc(settingsRef, updates, { merge: true });
    } catch (error) {
        handleError(error, 'updateGeneralSettings');
    }
};

// Add a dial-in record
export const addDialInRecord = async (record: Omit<DialInRecord, 'createdAt'>) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        const logsCollection = collection(db, "users", user.uid, "logs");
        return await addDoc(logsCollection, {
            ...record,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        handleError(error, 'addDialInRecord');
    }
};

export const addPrivateRoaster = async (roasterName: string) => {
    try {
        const privateRoastersDocRef = getPrivateRoastersDocRef();
        return await setDoc(privateRoastersDocRef, {
            names: arrayUnion(roasterName)
        }, { merge: true });
    } catch (error) {
        handleError(error, 'addPrivateRoaster');
    }
};

export const getPrivateRoasters = async (): Promise<string[]> => {
    try {
        const privateRoastersDocRef = getPrivateRoastersDocRef();
        const docSnap = await getDoc(privateRoastersDocRef);
        if (docSnap.exists()) {
            return docSnap.data().names || [];
        }
        return [];
    } catch (error) {
        handleError(error, 'getPrivateRoasters');
        return []; // Return empty array on error
    }
};

export const getBeansByRoaster = async (roasterName: string): Promise<SavedBean[]> => {
    try {
        const beansCollection = getBeansCollection();
        const q = query(beansCollection, where("roasterName", "==", roasterName));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedBean));
    } catch (error) {
        handleError(error, 'getBeansByRoaster');
        return []; // Return empty array on error
    }
}

export const deletePrivateRoaster = async (roasterName: string) => {
    try {
        const beans = await getBeansByRoaster(roasterName);
        if (beans.length > 0) {
            throw new Error(`לא ניתן למחוק את בית הקלייה "${roasterName}" מאחר ויש לו פולים משויכים.`);
        }

        const privateRoastersDocRef = getPrivateRoastersDocRef();
        return await updateDoc(privateRoastersDocRef, {
            names: arrayRemove(roasterName)
        });
    } catch (error) {
        handleError(error, 'deletePrivateRoaster');
    }
};
