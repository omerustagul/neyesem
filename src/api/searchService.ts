import { collection, getDocs, query } from 'firebase/firestore';
import { db } from './firebase';
import { Post } from './postService';

export interface UserProfile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    bio?: string;
    follower_count?: number;
    following_count?: number;
    post_count?: number;
    level?: number;
}

export const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
    if (!searchTerm) return [];

    try {
        const term = searchTerm.toLowerCase();
        // Fetch all profiles and filter in memory for both username and display_name
        const q = query(collection(db, 'profiles'));
        const snapshot = await getDocs(q);

        return snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as UserProfile))
            .filter(user =>
                user.username?.toLowerCase().includes(term) ||
                user.display_name?.toLowerCase().includes(term)
            )
            .slice(0, 15);
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
};

export const searchPosts = async (searchTerm: string): Promise<Post[]> => {
    if (!searchTerm) return [];

    try {
        const term = searchTerm.toLowerCase();
        // Fetch posts and filter in memory to match caption, username, display_name, food_name
        const q = query(collection(db, 'posts'));
        const snapshot = await getDocs(q);

        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Post));

        return posts.filter(post =>
            post.caption?.toLowerCase().includes(term) ||
            post.username?.toLowerCase().includes(term) ||
            (post as any).food_name?.toLowerCase().includes(term) ||
            (post as any).display_name?.toLowerCase().includes(term)
        ).slice(0, 15);
    } catch (error) {
        console.error('Error searching posts:', error);
        return [];
    }
};
