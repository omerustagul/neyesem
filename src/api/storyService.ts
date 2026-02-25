import {
    collection,
    DocumentData,
    onSnapshot,
    query,
    QuerySnapshot,
    where
} from 'firebase/firestore';
import { db } from './firebase';

export interface Story {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    contentUrl: string;
    contentType: 'image' | 'video';
    text?: string;
    textColor?: string;
    createdAt: any;
    expiresAt: any;
    viewedBy: string[];
}

export const subscribeToActiveStories = (
    followingIds: string[],
    currentUserId: string,
    callback: (stories: Story[]) => void
) => {
    const allIds = [...new Set([...followingIds, currentUserId])].filter(id => !!id);

    if (allIds.length === 0) {
        callback([]);
        return () => { };
    }

    // Use a simpler query that doesn't require composite indexes
    const q = query(
        collection(db, 'stories'),
        where('userId', 'in', allIds.slice(0, 30))
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const now = Date.now();
        const stories = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                userId: data.userId || data.user_id,
                avatarUrl: data.avatarUrl || data.avatar_url,
                contentUrl: data.contentUrl || data.content_url,
                createdAt: data.createdAt || data.created_at,
                expiresAt: data.expiresAt || data.expires_at
            } as Story;
        });

        // Filter expired stories and sort by createdAt desc in memory
        const validStories = stories
            .filter(story => {
                const expiresAt = story.expiresAt?.toDate ? story.expiresAt.toDate().getTime() : new Date(story.expiresAt).getTime();
                return expiresAt > now;
            })
            .sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            });

        callback(validStories);
    }, (error) => {
        console.error("Error subscribing to stories:", error);
    });
};

import { arrayUnion, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export const deleteStory = async (storyId: string) => {
    try {
        await deleteDoc(doc(db, 'stories', storyId));
        return true;
    } catch (error) {
        console.error("Error deleting story:", error);
        throw error;
    }
};

export const markStoryAsViewed = async (storyId: string, userId: string) => {
    try {
        await updateDoc(doc(db, 'stories', storyId), {
            viewedBy: arrayUnion(userId)
        });
    } catch (error) {
        console.error("Error marking story as viewed:", error);
    }
};
