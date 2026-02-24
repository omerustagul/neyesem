import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    increment,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notificationService';

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    username: string;
    display_name: string;
    avatar_url: string;
    text: string;
    likes_count: number;
    liked_by: string[];
    created_at: any;
}

// Subscribe to post comments
export const subscribeToComments = (
    postId: string,
    callback: (comments: Comment[]) => void
) => {
    try {
        const q = query(
            collection(db, 'comments'),
            where('postId', '==', postId)
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const comments = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                } as Comment));

                // Sort client-side to avoid index requirement for now
                comments.sort((a, b) => {
                    const timeA = a.created_at?.toMillis?.() || 0;
                    const timeB = b.created_at?.toMillis?.() || 0;
                    return timeA - timeB;
                });

                callback(comments);
            },
            (error) => {
                console.error('Error subscribing to comments:', error);
                callback([]);
            }
        );
    } catch (error) {
        console.error('Error setting up comments subscription:', error);
        return () => { };
    }
};

// Add comment
export const addComment = async (
    postId: string,
    userId: string,
    username: string,
    display_name: string,
    avatar_url: string,
    text: string
): Promise<string> => {
    try {
        const commentData = {
            postId,
            userId,
            username,
            display_name,
            avatar_url,
            text,
            likes_count: 0,
            liked_by: [],
            created_at: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'comments'), commentData);

        // Increment post comment count
        await updateDoc(doc(db, 'posts', postId), {
            comments_count: increment(1),
        });

        // Send notification to post owner
        const postSnap = await getDoc(doc(db, 'posts', postId));
        if (postSnap.exists()) {
            const postData = postSnap.data();
            await createNotification(
                postData.userId,
                { uid: userId, username, avatar_url },
                'comment',
                `gönderine yorum yaptı: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
                undefined,
                { postId, commentId: docRef.id }
            );
        }

        return docRef.id;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};

// Delete comment
export const deleteComment = async (
    commentId: string,
    postId: string
): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'comments', commentId));

        // Decrement post comment count
        await updateDoc(doc(db, 'posts', postId), {
            comments_count: increment(-1),
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};

// Update comment
export const updateComment = async (
    commentId: string,
    text: string
): Promise<void> => {
    try {
        await updateDoc(doc(db, 'comments', commentId), {
            text,
            updated_at: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
    }
};

// Toggle comment like
export const toggleCommentLike = async (
    commentId: string,
    userId: string
): Promise<void> => {
    try {
        const commentRef = doc(db, 'comments', commentId);
        const commentSnap = await getDoc(commentRef);

        if (!commentSnap.exists()) {
            throw new Error('Comment not found');
        }

        const comment = commentSnap.data() as Comment;
        const isLiked = comment.liked_by?.includes(userId);

        if (isLiked) {
            await updateDoc(commentRef, {
                liked_by: arrayRemove(userId),
                likes_count: increment(-1),
            });
        } else {
            await updateDoc(commentRef, {
                liked_by: arrayUnion(userId),
                likes_count: increment(1),
            });
        }
    } catch (error) {
        console.error('Error toggling comment like:', error);
        throw error;
    }
};
