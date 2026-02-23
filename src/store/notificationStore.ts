import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { create } from 'zustand';
import { db } from '../api/firebase';

export type NotificationType =
    | 'like' | 'comment' | 'follow' | 'follow_request'
    | 'save' | 'mention' | 'level_up' | 'reward' | 'xp_gained' | 'system' | 'list' | 'archive';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title?: string;
    body: string;
    is_read: boolean;
    created_at: string;
    recipient_id: string;
    sender?: {
        username: string;
        avatar_url: string;
    };
}

interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    fetchNotifications: () => Promise<void>;
    addNotification: (notification: AppNotification) => void;
    markAsRead: (id: string) => Promise<void>;
    setupListener: (userId: string) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    fetchNotifications: async () => {
        set({ isLoading: true });
        set({ isLoading: false });
    },
    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },
    markAsRead: async (id) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { is_read: true });
            set((state) => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    },
    setupListener: (userId: string) => {
        try {
            const q = query(
                collection(db, 'notifications'),
                where('recipient_id', '==', userId),
                orderBy('created_at', 'desc')
            );

            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const notifications = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as AppNotification[];

                    set({
                        notifications,
                        unreadCount: notifications.filter(n => !n.is_read).length,
                    });
                },
                (error: any) => {
                    // Silently handle index errors
                    console.warn('Notifications listener beklemede (index oluşturuluyor):', error.code);
                    set({
                        notifications: [],
                        unreadCount: 0,
                    });
                }
            );

            return unsubscribe;
        } catch (error) {
            console.error('Listener başlatma hatası:', error);
            return () => { };
        }
    }
}));
