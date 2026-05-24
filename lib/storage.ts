import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, auth } from "@/firebase-config";
import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";

export async function uploadBeanImage(file: File): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Compress the image before uploading
    const options = {
        maxSizeMB: 0.1, // 100KB max size
        maxWidthOrHeight: 600, // max 600x600 px
        useWebWorker: false, // Disabling web worker to prevent hangs in some environments
        fileType: "image/webp" as string,
    };

    try {
        const compressedFile = await imageCompression(file, options);
        
        const filename = `${uuidv4()}.webp`;
        const storageRef = ref(storage, `users/${user.uid}/beans/${filename}`);

        const snapshot = await uploadBytes(storageRef, compressedFile);
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error compressing or uploading image:", error);
        throw error;
    }
}

export async function deleteBeanImage(imageUrl: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return; // Don't throw error here to allow bean deletion even if image delete fails

    try {
        // Extract the path from the download URL
        // Example URL: https://firebasestorage.googleapis.com/v0/b/barista-mate.appspot.com/o/users%2F123%2Fbeans%2F456.webp?alt=media&token=...
        const decodedUrl = decodeURIComponent(imageUrl);
        const urlObj = new URL(decodedUrl);
        const path = urlObj.pathname;
        
        // The path looks like /v0/b/project.appspot.com/o/users/123/beans/456.webp
        const pathSegments = path.split('/o/');
        if (pathSegments.length === 2) {
            const objectPath = pathSegments[1];
            // Security check: Only delete if it's inside this user's folder
            if (objectPath.startsWith(`users/${user.uid}/`)) {
                const imageRef = ref(storage, objectPath);
                await deleteObject(imageRef);
            }
        }
    } catch (error) {
        console.error("Error deleting image:", error);
    }
}
