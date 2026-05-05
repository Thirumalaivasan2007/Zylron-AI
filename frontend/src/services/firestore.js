import { collection, doc, setDoc, getDocs, query, where, orderBy, deleteDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const CHATS_COLLECTION = 'chats';

export const saveChatToCloud = async (userId, sessionId, chatTitle, messages, pinned = false, folder, workspaceId) => {
    if (!userId) return;
    try {
        const chatRef = doc(db, CHATS_COLLECTION, sessionId);
        
        const payload = {
            userId,
            sessionId,
            message: chatTitle,
            messages: messages,
            pinned,
            workspaceId: workspaceId || userId, // Real Logic: Default to personal UID
            updatedAt: serverTimestamp()
        };

        if (folder !== undefined) {
            payload.folder = folder;
        }

        // Only set createdAt for the first time
        if (messages.length <= 2) {
            payload.createdAt = serverTimestamp();
        }

        await setDoc(chatRef, payload, { merge: true });
    } catch (error) {
        console.error("Error saving chat to cloud:", error);
    }
};

export const saveFeedbackToCloud = async (sessionId, messages) => {
    if (!sessionId) return;
    try {
        const chatRef = doc(db, CHATS_COLLECTION, sessionId);
        await updateDoc(chatRef, {
            messages: messages,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving feedback to cloud:", error);
    }
};

export const fetchCloudChats = async (userId, workspaceId) => {
    if (!userId) return [];
    try {
        // Real Logic: Filter by workspaceId to separate Personal from Team
        const q = query(
            collection(db, CHATS_COLLECTION), 
            where("workspaceId", "==", workspaceId || userId),
            orderBy("updatedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const chats = [];
        querySnapshot.forEach((doc) => {
            chats.push(doc.data());
        });
        
        return chats;
    } catch (error) {
        console.error("Error fetching chats from cloud:", error);
        // Fallback if index isn't created yet
        const qFallback = query(
            collection(db, CHATS_COLLECTION), 
            where("workspaceId", "==", workspaceId || userId)
        );
        const snapFallback = await getDocs(qFallback);
        const chatsFallback = [];
        snapFallback.forEach((doc) => chatsFallback.push(doc.data()));
        return chatsFallback.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
    }
};

export const deleteCloudChat = async (sessionId) => {
    try {
        await deleteDoc(doc(db, CHATS_COLLECTION, sessionId));
    } catch (error) {
        console.error("Error deleting cloud chat:", error);
    }
};

// Public Chat Sharing - Optimized for Speed
export const createPublicShare = async (messages, persona) => {
    try {
        // Payload Trimming: Remove non-essential UI state to speed up upload
        const trimmedMessages = messages.map(m => ({
            type: m.type,
            content: m.content,
            imageUrl: m.imageUrl || null,
            isSystem: m.isSystem || false
        }));

        const publicId = Math.random().toString(36).substring(2, 10);
        const shareRef = doc(db, 'public_shares', publicId);
        
        // Fast Write
        await setDoc(shareRef, {
            messages: trimmedMessages,
            persona,
            createdAt: serverTimestamp()
        });
        
        return publicId;
    } catch (error) {
        console.error("Error creating public share:", error);
        return null;
    }
};

// Instant Share Background Sync
export const createPublicShareWithId = async (publicId, messages, persona) => {
    try {
        const shareRef = doc(db, 'public_shares', publicId);
        await setDoc(shareRef, {
            messages,
            persona,
            createdAt: serverTimestamp()
        });
        return publicId;
    } catch (error) {
        console.error("Error in background share sync:", error);
        return null;
    }
};

export const fetchPublicChat = async (publicId) => {
    try {
        const shareRef = doc(db, 'public_shares', publicId);
        const docSnap = await getDocs(query(collection(db, 'public_shares'), where("__name__", "==", publicId)));
        if (!docSnap.empty) {
            return docSnap.docs[0].data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching public chat:", error);
        return null;
    }
};
// User Profiles & Preferences Sync
export const saveUserPreferences = async (userId, preferences) => {
    if (!userId) return;
    try {
        const prefRef = doc(db, 'user_preferences', userId);
        await setDoc(prefRef, {
            ...preferences,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error saving user preferences:", error);
    }
};

export const fetchUserPreferences = async (userId) => {
    if (!userId) return null;
    try {
        const prefRef = doc(db, 'user_preferences', userId);
        const docSnap = await getDoc(prefRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching user preferences:", error);
        return null;
    }
};
