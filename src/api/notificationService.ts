import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
