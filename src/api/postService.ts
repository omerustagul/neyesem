import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    arrayUnion,
    arrayRemove,
    limit,
    where,
    QueryConstraint,
    onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Post {
    id: string;
    userId: string;
    username: string;
    display_name: string;
    avatar_url: string;
    caption: string;
    content_type: 'text' | 'image' | 'video' | 'embed';
    content_url?: string;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    liked_by: string[];
    created_at: any;
    updated_at: any;
}

// Create post
export const createPost = async (
    userId: string,
    username: string,
    display_name: string,
    avatar_url: string,
    caption: string,
    content_type: 'text' | 'image' | 'video' | 'embed',
    content_url?: string
): Promise<string> => {
    try {
        const postData = {
            userId,
            username,
            display_name,
            avatar_url,
            caption,
            content_type,
            content_url: content_url || null,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            liked_by: [],
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'posts'), postData);

        // Increment user post count
        await updateDoc(doc(db, 'profiles', userId), {
            post_count: increment(1),
        });

        return docRef.id;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

// Get user's posts
export const getUserPosts = async (userId: string): Promise<Post[]> => {
    try {
        const q = query(
            collection(db, 'posts'),
            where('userId', '==', userId),
            orderBy('created_at', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
        } as Post));
    } catch (error) {
        console.error('Error fetching user posts:', error);
        return [];
    }
};

// Get feed posts (all posts ordered by date)
export const getFeedPosts = async (limitCount: number = 20): Promise<Post[]> => {
    try {
        const q = query(
            collection(db, 'posts'),
            orderBy('created_at', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
        } as Post));
    } catch (error) {
        console.error('Error fetching feed posts:', error);
        return [];
    }
};

// Real-time listener for user posts
export const subscribeToUserPosts = (
    userId: string,
    callback: (posts: Post[]) => void
) => {
    try {
        const q = query(
            collection(db, 'posts'),
            where('userId', '==', userId),
            orderBy('created_at', 'desc')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const posts = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                } as Post));
                callback(posts);
            },
            (error) => {
                console.error('Error subscribing to user posts:', error);
                callback([]);
            }
        );
    } catch (error) {
        console.error('Error setting up subscription:', error);
        return () => {};
    }
};

// Real-time listener for feed posts
export const subscribeToFeedPosts = (
    callback: (posts: Post[]) => void,
    limitCount: number = 20
) => {
    try {
        const q = query(
            collection(db, 'posts'),
            orderBy('created_at', 'desc'),
            limit(limitCount)
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const posts = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                } as Post));
                callback(posts);
            },
            (error) => {
                console.error('Error subscribing to feed posts:', error);
                callback([]);
            }
        );
    } catch (error) {
        console.error('Error setting up subscription:', error);
        return () => {};
    }
};

// Toggle like
export const togglePostLike = async (
    postId: string,
    userId: string
): Promise<void> => {
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            throw new Error('Post not found');
        }

        const post = postSnap.data() as Post;
        const isLiked = post.liked_by.includes(userId);

        if (isLiked) {
            // Unlike
            await updateDoc(postRef, {
                liked_by: arrayRemove(userId),
                likes_count: increment(-1),
            });
        } else {
            // Like
            await updateDoc(postRef, {
                liked_by: arrayUnion(userId),
                likes_count: increment(1),
            });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
};

// Increment comment count
export const incrementCommentCount = async (postId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'posts', postId), {
            comments_count: increment(1),
        });
    } catch (error) {
        console.error('Error incrementing comment count:', error);
        throw error;
    }
};

// Increment share count
export const incrementShareCount = async (postId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'posts', postId), {
            shares_count: increment(1),
        });
    } catch (error) {
        console.error('Error incrementing share count:', error);
        throw error;
    }
};

// Delete post
export const deletePost = async (postId: string, userId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'posts', postId));

        // Decrement user post count
        await updateDoc(doc(db, 'profiles', userId), {
            post_count: increment(-1),
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};
