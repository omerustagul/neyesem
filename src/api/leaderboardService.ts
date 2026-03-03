import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from './searchService';

export const getLeaderboard = async (maxSize: number = 50): Promise<UserProfile[]> => {
    try {
        const q = query(
            collection(db, 'profiles'),
            orderBy('xp', 'desc'),
            limit(maxSize)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as UserProfile));
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
};

export const getUserRank = async (xp: number): Promise<number> => {
    try {
        // Count how many users have more XP than the current user
        const q = query(
            collection(db, 'profiles'),
            where('xp', '>', xp)
        );
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count + 1;
    } catch (error) {
        console.error('Error getting user rank:', error);
        return 0;
    }
};
