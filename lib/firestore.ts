
import { auth, db } from "@/firebase-config";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import type { SavedBean } from "./types";

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
