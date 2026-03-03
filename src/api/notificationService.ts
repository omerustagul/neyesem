import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { NotificationType } from '../store/notificationStore';
import { db } from './firebase';

export const createNotification = async (
    recipientId: string,
    sender: { username: string; avatar_url: string; uid: string },
    type: NotificationType,
    body: string,
    title?: string,
    metadata?: any
) => {
    // Don't send notification to self
    if (recipientId === sender.uid) return;

    try {
        await addDoc(collection(db, 'notifications'), {
            recipient_id: recipientId,
            sender: {
                username: sender.username,
                avatar_url: sender.avatar_url,
                uid: sender.uid
            },
            type,
            title: title || '',
            body,
            is_read: false,
            created_at: serverTimestamp(),
            ...metadata
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

export const getNotificationSettings = async (currentUserId: string, targetUserId: string) => {
    try {
        const docId = `${currentUserId}_${targetUserId}`;
        const docRef = doc(db, 'profile_notifications', docId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return snap.data();
        }
        return { posts: false, stories: false };
    } catch (error) {
        console.error('Error getting notification settings:', error);
        return { posts: false, stories: false };
    }
};

export const updateNotificationSettings = async (
    currentUserId: string,
    targetUserId: string,
    settings: { posts: boolean; stories: boolean }
) => {
    try {
        const docId = `${currentUserId}_${targetUserId}`;
        const docRef = doc(db, 'profile_notifications', docId);
        await setDoc(docRef, {
            subscriber_id: currentUserId,
            target_id: targetUserId,
            ...settings,
            updated_at: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        throw error;
    }
};

export const notifySubscribers = async (
    authorId: string,
    type: 'new_post' | 'new_story',
    metadata: any
) => {
    try {
        // Query subscribers who have notifications enabled for this type
        const field = type === 'new_post' ? 'posts' : 'stories';
        const q = query(
            collection(db, 'profile_notifications'),
            where('target_id', '==', authorId),
            where(field, '==', true)
        );

        const snapshot = await getDocs(q);
        const senderSnap = await getDoc(doc(db, 'profiles', authorId));
        const senderData = senderSnap.data();

        if (!senderData) return;

        const body = type === 'new_post' ? 'yeni bir gönderi paylaştı.' : 'hikayesine ekleme yaptı.';
        const notificationType = type === 'new_post' ? 'post' : 'story';

        const promises = snapshot.docs.map(docSnap => {
            const subscriberId = docSnap.data().subscriber_id;
            return createNotification(
                subscriberId,
                {
                    uid: authorId,
                    username: senderData.username || 'Bir kullanıcı',
                    avatar_url: senderData.avatar_url || ''
                },
                notificationType as any,
                body,
                undefined,
                metadata
            );
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Error notifying subscribers:', error);
    }
};
