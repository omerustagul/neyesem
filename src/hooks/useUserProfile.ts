import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../api/firebase';

export interface UserProfileBasic {
    level: number;
    is_verified: boolean;
    display_name?: string;
    username?: string;
    avatar_url?: string;
}

// Module-level cache to avoid redundant Firestore reads
const profileCache = new Map<string, UserProfileBasic>();

/**
 * Lightweight hook to fetch a user's level and verification status.
 * Results are cached in-memory for the session lifetime.
 */
export const useUserProfile = (userId: string | undefined): UserProfileBasic | null => {
    const [profile, setProfile] = useState<UserProfileBasic | null>(
        userId ? (profileCache.get(userId) ?? null) : null
    );

    useEffect(() => {
        if (!userId) return;

        // Already cached
        if (profileCache.has(userId)) {
            setProfile(profileCache.get(userId)!);
            return;
        }

        let cancelled = false;
        getDoc(doc(db, 'profiles', userId)).then((snap) => {
            if (cancelled) return;
            if (snap.exists()) {
                const data = snap.data();
                const p: UserProfileBasic = {
                    level: data.level ?? 1,
                    is_verified: data.is_verified ?? false,
                    display_name: data.display_name,
                    username: data.username,
                    avatar_url: data.avatar_url,
                };
                // Auto-verify level 10 (Altın Çatal) users
                if (p.level >= 10) p.is_verified = true;
                profileCache.set(userId, p);
                setProfile(p);
            }
        }).catch(() => {
            // Silent fail
        });

        return () => { cancelled = true; };
    }, [userId]);

    return profile;
};
