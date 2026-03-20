
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
        const sanitizedBeanData = {
            ...beanData,
            beanName: beanData.beanName?.trim(),
            roasterName: beanData.roasterName?.trim(),
        };
        const isTestData = process.env.NODE_ENV === 'development' || 
                           process.env.NODE_ENV === 'test' || 
                           process.env.VITEST != null;
        
        return await addDoc(beansCollection, {
            ...sanitizedBeanData,
            isTestData,
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
        const sanitizedUpdates = { ...updates };
        if (sanitizedUpdates.beanName) {
            sanitizedUpdates.beanName = sanitizedUpdates.beanName.trim();
        }
        if (sanitizedUpdates.roasterName) {
            sanitizedUpdates.roasterName = sanitizedUpdates.roasterName.trim();
        }
        const beanRef = doc(beansCollection, id);
        return await updateDoc(beanRef, sanitizedUpdates);
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
        const userRef = doc(db, 'users', user.uid);
        return await setDoc(userRef, { settings: { general: updates } }, { merge: true });
    } catch (error) {
        handleError(error, 'updateGeneralSettings');
    }
};

// Update maintenance frequencies
export const updateMaintenanceFrequencies = async (frequencies: {[key: string]: number}) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        const userRef = doc(db, 'users', user.uid);
        return await setDoc(userRef, { preferences: { maintenanceFrequencies: frequencies } }, { merge: true });
    } catch (error) {
        handleError(error, 'updateMaintenanceFrequencies');
    }
};



// Save the last shot record
export const saveLastShot = async (record: Omit<DialInRecord, 'createdAt'>) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
        const lastShotRef = doc(db, 'users', user.uid, 'lastShot', 'current');
        return await setDoc(lastShotRef, {
            ...record,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        handleError(error, 'saveLastShot');
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

export const submitFeedback = async (message: string) => {
    try {
        const user = auth.currentUser;
        const userContext = user ? user.email : "anonymous";
        const feedbackCollection = collection(db, "feedback");
        return await addDoc(feedbackCollection, {
            message: message.trim(),
            timestamp: serverTimestamp(),
            userContext,
        });
    } catch (error) {
        handleError(error, "submitFeedback");
    }
};

export const getGlobalRoasters = async (): Promise<{id: string, name: string}[]> => {
    try {
        const globalRoastersRef = collection(db, "global_roasters");
        const querySnapshot = await getDocs(globalRoastersRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name as string
        }));
    } catch (error: any) {
        if (error.code === 'permission-denied') return [];
        handleError(error, 'getGlobalRoasters');
        return [];
    }
};

export const getGlobalBeans = async (roasterName: string): Promise<{id: string, roasterName: string, beanName: string, roastLevel?: number, flavorTags?: string[]}[]> => {
    try {
        const globalBeansRef = collection(db, "global_beans");
        const q = query(globalBeansRef, where("roasterName", "==", roasterName.trim()));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            roasterName: doc.data().roasterName,
            beanName: doc.data().beanName,
            roastLevel: doc.data().roastLevel,
            flavorTags: doc.data().flavorTags,
        }));
    } catch (error: any) {
        if (error.code === 'permission-denied') return [];
        handleError(error, 'getGlobalBeans');
        return [];
    }
};

export const submitForVerification = async (type: 'roaster' | 'bean', data: any) => {
    try {
        const user = auth.currentUser;
        if (!user) return; // Silent return if disconnected
        
        const pendingRef = collection(db, "pending_verification");
        await addDoc(pendingRef, {
            type,
            ...data,
            submittedBy: user.uid,
            submittedAt: serverTimestamp(),
            status: 'pending'
        });
    } catch (error: any) {
        // We gracefully ignore permission errors if validation rules are strict or logging out
        if (error?.code !== 'permission-denied') {
            console.error("Error submitting for verification:", error);
        }
    }
};
