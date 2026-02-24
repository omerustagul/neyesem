import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserList {
    id: string;
    userId: string;
    title: string;
    postIds: string[];
    created_at: any;
}

// Subscribe to user lists
export const subscribeToUserLists = (
    userId: string,
    callback: (lists: UserList[]) => void
) => {
    try {
        const q = query(
            collection(db, 'lists'),
            where('userId', '==', userId)
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const lists = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                } as UserList));

                // Sort client-side
                lists.sort((a, b) => {
                    const timeA = a.created_at?.toMillis?.() || 0;
                    const timeB = b.created_at?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                callback(lists);
            },
            (error) => {
                console.error('Error subscribing to user lists:', error);
                callback([]);
            }
        );
    } catch (error) {
        console.error('Error setting up lists subscription:', error);
        return () => { };
    }
};

// Create new list
export const createList = async (
    userId: string,
    title: string
): Promise<string> => {
    try {
        const listData = {
            userId,
            title,
            postIds: [],
            created_at: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'lists'), listData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating list:', error);
        throw error;
    }
};

// Toggle post in list
export const togglePostInList = async (
    listId: string,
    postId: string,
    shouldAdd: boolean
): Promise<void> => {
    try {
        const listRef = doc(db, 'lists', listId);
        await updateDoc(listRef, {
            postIds: shouldAdd ? arrayUnion(postId) : arrayRemove(postId),
            updated_at: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error toggling post in list:', error);
        throw error;
    }
};

// Get lists containing a post
export const getListsContainingPost = async (
    userId: string,
    postId: string
): Promise<string[]> => {
    try {
        const q = query(
            collection(db, 'lists'),
            where('userId', '==', userId),
            where('postIds', 'array-contains', postId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => doc.id);
    } catch (error) {
        console.error('Error finding lists with post:', error);
        return [];
    }
};
