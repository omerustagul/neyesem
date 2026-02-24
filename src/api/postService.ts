import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where
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
    saves_count: number;
    liked_by: string[];
    saved_by: string[];
    is_archived: boolean;
    created_at: any;
    updated_at: any;
    cooking_time?: string;
    difficulty?: string;
    calories?: number;
    protein?: string;
    thumbnail_url?: string;
}

// Create post
export const createPost = async (
    userId: string,
    username: string,
    display_name: string,
    avatar_url: string,
    caption: string,
    content_type: 'text' | 'image' | 'video' | 'embed',
    content_url?: string,
    cooking_time?: string,
    difficulty?: string,
    calories?: number,
    protein?: string,
    thumbnail_url?: string
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
            saves_count: 0,
            liked_by: [],
            saved_by: [],
            is_archived: false,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
            cooking_time: cooking_time || null,
            difficulty: difficulty || null,
            calories: calories || null,
            protein: protein || null,
            thumbnail_url: thumbnail_url || null,
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
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            } as Post))
            .filter(p => !p.is_archived)
            .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
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
            where('is_archived', '==', false)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            } as Post))
            .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))
            .slice(0, limitCount);
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
        // Only query by userId, filter is_archived in memory to avoid composite index
        const q = query(
            collection(db, 'posts'),
            where('userId', '==', userId)
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const posts = snapshot.docs
                    .map((docSnap) => ({
                        id: docSnap.id,
                        ...docSnap.data(),
                    } as Post))
                    .filter(p => !p.is_archived)
                    .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
                callback(posts);
            },
            (error) => {
                console.error('Error subscribing to user posts:', error);
                callback([]);
            }
        );
    } catch (error) {
        console.error('Error setting up subscription:', error);
        return () => { };
    }
};

// Real-time listener for archived posts
export const subscribeToArchivedPosts = (
    userId: string,
    callback: (posts: Post[]) => void
) => {
    try {
        const q = query(
            collection(db, 'posts'),
            where('userId', '==', userId)
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const posts = snapshot.docs
                    .map((docSnap) => ({
                        id: docSnap.id,
                        ...docSnap.data(),
                    } as Post))
                    .filter(p => p.is_archived === true)
                    .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
                callback(posts);
            },
            (error) => {
                console.error('Error subscribing to archived posts:', error);
                callback([]);
            }
        );
    } catch (error) {
        console.error('Error setting up subscription:', error);
        return () => { };
    }
};

// Real-time listener for feed posts from specific users (following)
export const subscribeToFollowedFeed = (
    userIds: string[],
    callback: (posts: Post[]) => void,
    limitCount: number = 20
) => {
    try {
        // Fetch ALL non-archived posts and filter in memory
        // This avoids composite index requirements (userId + is_archived)
        const q = query(
            collection(db, 'posts'),
            where('is_archived', '==', false)
        );

        return onSnapshot(
            q,
            (snapshot) => {
                let posts = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                } as Post));

                // If following someone, filter to only their posts
                if (userIds && userIds.length > 0) {
                    posts = posts.filter(p => userIds.includes(p.userId));
                }

                // Sort by date desc, limit
                posts.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
                callback(posts.slice(0, limitCount));
            },
            (error) => {
                console.warn('Feed error:', error.message);
                callback([]);
            }
        );
    } catch (error) {
        console.error('Error setting up subscription:', error);
        return () => { };
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
            where('is_archived', '==', false)
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const posts = snapshot.docs
                    .map((docSnap) => ({
                        id: docSnap.id,
                        ...docSnap.data(),
                    } as Post))
                    .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))
                    .slice(0, limitCount);
                callback(posts);
            },
            (error) => {
                if (error.code === 'failed-precondition') {
                    console.warn('Feed index oluşturuluyor, lütfen bekleyin...');
                } else {
                    console.error('Error subscribing to feed posts:', error);
                }
                callback([]);
            }
        );
    } catch (error) {
        console.error('Error setting up subscription:', error);
        return () => { };
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

// Toggle save
export const togglePostSave = async (
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
        const savedBy = post.saved_by || [];
        const isSaved = savedBy.includes(userId);

        if (isSaved) {
            // Unsave
            await updateDoc(postRef, {
                saved_by: arrayRemove(userId),
                saves_count: increment(-1),
            });
        } else {
            // Save
            await updateDoc(postRef, {
                saved_by: arrayUnion(userId),
                saves_count: increment(1),
            });
        }
    } catch (error) {
        console.error('Error toggling save:', error);
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

// Archive post
export const archivePost = async (postId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'posts', postId), {
            is_archived: true,
            updated_at: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error archiving post:', error);
        throw error;
    }
};

// Unarchive post
export const unarchivePost = async (postId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'posts', postId), {
            is_archived: false,
            updated_at: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error unarchiving post:', error);
        throw error;
    }
};

// Update post
export const updatePost = async (
    postId: string,
    updates: Partial<Post>
): Promise<void> => {
    try {
        await updateDoc(doc(db, 'posts', postId), {
            ...updates,
            updated_at: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating post:', error);
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
