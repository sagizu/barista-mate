
import { auth, db } from "@/firebase-config";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { SavedBean, MaintenanceDates, GeneralSettings } from "./types";

const getBeansCollection = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return collection(db, "users", user.uid, "beans");
}

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
