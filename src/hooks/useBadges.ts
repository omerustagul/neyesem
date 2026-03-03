import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../api/firebase';
import { BADGES } from '../constants/badges';
import { useAuthStore } from '../store/authStore';
import { Badge, UserBadge } from '../types/badge.types';

export type ProfileBadge = Badge & {
    isEarned: boolean;
    earnedAt?: string;
};

// Kullanıcının kazandığı rozetleri getir — real-time listener
export const useUserBadges = (userId?: string) => {
    const { user } = useAuthStore();
    const targetId = userId ?? user?.uid;
    const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!targetId) {
            setLoading(false);
            return;
        }

        // Real-time listener — rozetler anında güncellenir
        const unsubscribe = onSnapshot(
            collection(db, 'users', targetId, 'badges'),
            (snapshot) => {
                setUserBadges(snapshot.docs.map(d => d.data() as UserBadge));
                setLoading(false);
            },
            (error) => {
                console.error('Failed to listen to user badges:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [targetId]);

    return { data: userBadges, loading };
};

// Profil sayfası için rozet listesini hazırla
// Kazanılanlar önce, kazanılmayanlar gri + kilitli gösterilir
export const useProfileBadges = (userId?: string): ProfileBadge[] => {
    const { data: userBadges = [] } = useUserBadges(userId);
    const { user } = useAuthStore();

    const earnedIds = new Set(userBadges.map(b => b.badgeId));

    return BADGES
        .filter(badge => {
            // Gizli rozetler kazanılmadan gösterilmez
            if (badge.isSecret && !earnedIds.has(badge.id)) return false;
            return true;
        })
        .map(badge => ({
            ...badge,
            isEarned: earnedIds.has(badge.id),
            earnedAt: userBadges.find(b => b.badgeId === badge.id)?.earnedAt,
        }))
        .sort((a, b) => {
            // Kazanılanlar önce
            if (a.isEarned && !b.isEarned) return -1;
            if (!a.isEarned && b.isEarned) return 1;
            return 0;
        });
};
