import { arrayRemove, arrayUnion, doc, getDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notificationService';

export const followUser = async (currentUserId: string, targetUserId: string) => {
    try {
        const batch = writeBatch(db);

        // Update target user's followers
        const targetRef = doc(db, 'profiles', targetUserId);
        batch.update(targetRef, {
            followers_count: increment(1),
            followers: arrayUnion(currentUserId)
        });

        // Update current user's following
        const currentRef = doc(db, 'profiles', currentUserId);
        batch.update(currentRef, {
            following_count: increment(1),
            following: arrayUnion(targetUserId)
        });

        await batch.commit();

        // Send notification
        const senderSnap = await getDoc(doc(db, 'profiles', currentUserId));
        const senderData = senderSnap.data();
        if (senderData) {
            await createNotification(
                targetUserId,
                {
                    uid: currentUserId,
                    username: senderData.username || 'Bir kullanıcı',
                    avatar_url: senderData.avatar_url || ''
                },
                'follow',
                `seni takip etmeye başladı.`
            );
        }
    } catch (error) {
        console.error('Error following user:', error);
        throw error;
    }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
    try {
        const batch = writeBatch(db);

        // Update target user's followers
        const targetRef = doc(db, 'profiles', targetUserId);
        batch.update(targetRef, {
            followers_count: increment(-1),
            followers: arrayRemove(currentUserId)
        });

        // Update current user's following
        const currentRef = doc(db, 'profiles', currentUserId);
        batch.update(currentRef, {
            following_count: increment(-1),
            following: arrayRemove(targetUserId)
        });

        await batch.commit();
    } catch (error) {
        console.error('Error unfollowing user:', error);
        throw error;
    }
};
