import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notificationService';
import { sendPalateSignal } from './palateService';

export type FoodCategory = 'meal' | 'dessert' | 'snack' | 'beverage' | 'breakfast' | 'appetizer';

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
    saves_count: number;
    views?: number;
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
    tags?: string[];
    ingredients?: string[];
    chainId?: string;
    parentPostId?: string;
    isChainRoot?: boolean;
    foodCategory?: FoodCategory;
    hashtags?: string[];
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
    thumbnail_url?: string,
    tags: string[] = [],
    ingredients: string[] = [],
    chainId?: string,
    parentPostId?: string,
    isChainRoot?: boolean,
    foodCategory?: FoodCategory,
    hashtags: string[] = []
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
            cooking_time: cooking_time || '',
            difficulty: difficulty || '',
            calories: calories || 0,
            protein: protein || '',
            thumbnail_url: thumbnail_url || '',
            tags,
            ingredients,
            chainId: chainId || null,
            parentPostId: parentPostId || null,
            isChainRoot: isChainRoot || false,
            foodCategory: foodCategory || null,
            hashtags,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            saves_count: 0,
            liked_by: [],
            saved_by: [],
            is_archived: false,
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
            where('userId', '==', userId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            } as Post))
            .filter(p => p.is_archived !== true)
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
            collection(db, 'posts')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            } as Post))
            .filter(p => p.is_archived !== true)
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
                    .filter(p => p.is_archived !== true)
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
            collection(db, 'posts')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                let posts = snapshot.docs.map(docSnap => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        ...data,
                        // Ensure both field names work
                        userId: data.userId || data.user_id,
                        username: data.username || data.author_name,
                        display_name: data.display_name || data.displayName,
                        avatar_url: data.avatar_url || data.avatarUrl || data.photoURL,
                        created_at: data.created_at || data.createdAt
                    } as Post;
                });

                // If following someone, filter to only their posts
                if (userIds && userIds.length > 0) {
                    posts = posts.filter(p => (userIds.includes(p.userId) || userIds.includes((p as any).user_id)) && p.is_archived !== true);
                } else {
                    posts = posts.filter(p => p.is_archived !== true);
                }

                // Sort by date desc, limit
                posts.sort((a, b) => {
                    const timeA = a.created_at?.seconds || a.created_at?.getTime?.() / 1000 || 0;
                    const timeB = b.created_at?.seconds || b.created_at?.getTime?.() / 1000 || 0;
                    return timeB - timeA;
                });
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
        // Query all posts and filter in memory to avoid missing posts without is_archived field
        const q = query(
            collection(db, 'posts')
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const posts = snapshot.docs
                    .map((docSnap) => ({
                        id: docSnap.id,
                        ...docSnap.data(),
                    } as Post))
                    .filter(p => p.is_archived !== true)
                    .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))
                    .slice(0, limitCount);
                callback(posts);
            },
            (error) => {
                console.error('Error subscribing to feed posts:', error);
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

            // Send Palate Signal
            sendPalateSignal(userId, 'like', postId, post.tags || []);

            // Send notification to post owner
            const senderSnap = await getDoc(doc(db, 'profiles', userId));
            const senderData = senderSnap.data();
            if (senderData) {
                await createNotification(
                    post.userId,
                    {
                        uid: userId,
                        username: senderData.username || 'Bir kullanıcı',
                        avatar_url: senderData.avatar_url || ''
                    },
                    'like',
                    `gönderini beğendi.`,
                    undefined,
                    { postId }
                );
            }
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
// Removed duplicate import; using existing top-level import from firebase/firestore
// db import is defined at the top

// Archive a post and decrement the owner's post_count
export const archivePostForUser = async (userId: string, postId: string) => {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { archived: true });
        const profileRef = doc(db, 'profiles', userId);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
            const current = snap.data().post_count ?? 0;
            const next = Math.max(0, current - 1);
            await updateDoc(profileRef, { post_count: next });
        }
    } catch (e) {
        console.error('Failed to archive post and update count', e);
    }
};

// Save a post for a user (increment saved list/count)
export const savePostForUser = async (userId: string, postId: string) => {
    try {
        // Example: add to a saved_by array on post and update profile's saved_count
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { saved_by: arrayUnion(userId) });
        const profileRef = doc(db, 'profiles', userId);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
            const current = snap.data().saved_count ?? 0;
            await updateDoc(profileRef, { saved_count: current + 1 });
        }
    } catch (e) {
        console.error('Failed to save post for user', e);
    }
};

// Get posts saved by a user
export const getSavedPostsForUser = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'posts'),
            where('saved_by', 'array-contains', userId)
        );
        const snap = await getDocs(q);
        const posts = snap.docs.map((d) => {
            const data = d.data() as any;
            return {
                id: d.id,
                userId: data.userId,
                username: data.username,
                display_name: data.display_name,
                avatar_url: data.avatar_url,
                caption: data.caption,
                content_type: data.content_type,
                content_url: data.content_url,
                likes_count: data.likes_count,
                comments_count: data.comments_count,
                saves_count: data.saves_count,
                saved_by: data.saved_by,
                is_archived: data.is_archived,
                created_at: data.created_at,
                updated_at: data.updated_at,
                thumbnail_url: data.thumbnail_url,
            } as Post;
        });
        // Optional: sort by created_at desc if available
        return posts;
    } catch (e) {
        console.error('Failed to fetch saved posts', e);
        return [] as Post[];
    }
};
