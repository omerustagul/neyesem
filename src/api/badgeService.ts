/**
 * Badge Engine — Client-Side
 * 
 * Rozetleri kazandıran ve ilerlemeyi takip eden servis.
 * Her aksiyon sonrası ilgili rozet kontrolü çağrılır.
 * Rozet zaten kazanılmışsa tekrar verilmez.
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    query,
    setDoc,
    where
} from 'firebase/firestore';
import { BADGES } from '../constants/badges';
import { BadgeId } from '../types/badge.types';
import { db } from './firebase';
import { createNotification } from './notificationService';

// ─── Core: Award a badge ──────────────────────────────────
const awardBadge = async (
    userId: string,
    badgeId: BadgeId,
    postId?: string
): Promise<boolean> => {
    try {
        const badgeRef = doc(db, 'users', userId, 'badges', badgeId);
        const existing = await getDoc(badgeRef);

        // Zaten kazanılmışsa tekrar verme
        if (existing.exists()) return false;

        const badge = BADGES.find(b => b.id === badgeId);
        if (!badge) return false;

        // Rozeti kaydet
        await setDoc(badgeRef, {
            badgeId,
            earnedAt: new Date().toISOString(),
            ...(postId ? { postId } : {}),
        });

        // XP ver
        try {
            await setDoc(doc(db, 'profiles', userId), {
                xp: increment(badge.xpReward),
            }, { merge: true });
        } catch (_) {
            // XP update might fail if profile doesn't exist, not critical
        }

        // Bildirim gönder (self notification)
        try {
            await createNotification(
                userId,
                {
                    uid: 'system',
                    username: 'Neyesem',
                    avatar_url: '',
                },
                'badge_earned' as any,
                `${badge.emoji} Yeni Rozet: ${badge.name} — ${badge.title}`,
            );
        } catch (_) {
            // Notification failure is not critical
        }

        console.log(`🏅 Badge awarded: ${badge.emoji} ${badge.name} to ${userId}`);
        return true;
    } catch (error) {
        console.error(`Error awarding badge ${badgeId}:`, error);
        return false;
    }
};

// ─── Core: Increment progress & auto-award ────────────────
const incrementProgress = async (
    userId: string,
    badgeId: BadgeId,
    target: number,
    postId?: string
): Promise<void> => {
    try {
        const progressRef = doc(db, 'users', userId, 'badgeProgress', badgeId);
        const snap = await getDoc(progressRef);
        const current = ((snap.data()?.current as number) ?? 0) + 1;

        await setDoc(progressRef, {
            badgeId,
            current,
            target,
            lastUpdated: new Date().toISOString(),
        }, { merge: true });

        if (current >= target) {
            await awardBadge(userId, badgeId, postId);
        }
    } catch (error) {
        console.error(`Error incrementing progress for ${badgeId}:`, error);
    }
};

// ─── Trigger: Yorum yapıldığında ──────────────────────────
export const checkBadgesOnComment = async (
    userId: string,
    _postId?: string
): Promise<void> => {
    try {
        // İlk yorum rozeti
        const userComments = await getDocs(
            query(collection(db, 'comments'), where('userId', '==', userId))
        );
        if (userComments.size <= 1) {
            await awardBadge(userId, 'ilk_yorum');
        }

        // Mahalle Bakkalı — 50 yorum
        await incrementProgress(userId, 'mahalle_bakkali', 50);
    } catch (error) {
        console.error('Error checking comment badges:', error);
    }
};

// ─── Trigger: Gönderi paylaşıldığında ─────────────────────
export const checkBadgesOnPost = async (
    userId: string,
    postId: string,
    postData?: {
        cuisineId?: string;
        moodScores?: Record<string, number>;
    }
): Promise<void> => {
    try {
        // İlk gönderi rozeti
        const userPosts = await getDocs(
            query(
                collection(db, 'posts'),
                where('userId', '==', userId),
                where('is_archived', '==', false)
            )
        );
        if (userPosts.size <= 1) {
            await awardBadge(userId, 'ilk_gonderi', postId);
        }

        // Hız Şefi — 30 günde 30 gönderi
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let recentCount = 0;
        userPosts.docs.forEach(d => {
            const createdAt = d.data().created_at;
            if (createdAt?.toDate && createdAt.toDate() >= thirtyDaysAgo) {
                recentCount++;
            }
        });
        if (recentCount >= 30) {
            await awardBadge(userId, 'hiz_sefi', postId);
        }

        // Gece Kuşu — gece yarısı modunda gönderi  
        const hour = new Date().getHours();
        if (hour >= 23 || hour <= 2) {
            await incrementProgress(userId, 'gece_kusu', 7, postId);
        }

        // Damak Ateşi — acı meydan okuma modunda gönderi
        if (postData?.moodScores?.aci_meydan_okuma && postData.moodScores.aci_meydan_okuma >= 0.5) {
            await incrementProgress(userId, 'damak_atesi', 5, postId);
        }

        // Lezzet Gezgini — 5 farklı mutfak
        if (postData?.cuisineId) {
            const cuisinePosts = await getDocs(
                query(
                    collection(db, 'posts'),
                    where('userId', '==', userId),
                )
            );
            const uniqueCuisines = new Set<string>();
            cuisinePosts.docs.forEach(d => {
                const cId = d.data().cuisineId || d.data().foodCategory;
                if (cId) uniqueCuisines.add(String(cId));
            });
            if (uniqueCuisines.size >= 5) {
                await awardBadge(userId, 'lezzet_gezgini', postId);
            }
        }
    } catch (error) {
        console.error('Error checking post badges:', error);
    }
};

// ─── Trigger: Beğeni yapıldığında ─────────────────────────
export const checkBadgesOnLike = async (
    likerId: string,
    postOwnerId: string,
    postId: string,
    newLikesCount: number
): Promise<void> => {
    try {
        // Beğenen kullanıcıya — İlk beğeni rozeti
        const userLikes = await getDocs(
            query(collection(db, 'posts'), where('liked_by', 'array-contains', likerId))
        );
        if (userLikes.size <= 1) {
            await awardBadge(likerId, 'ilk_begeni');
        }

        // Gönderi sahibine — Duyurdum Sana (100 beğeni)
        if (newLikesCount >= 100) {
            await awardBadge(postOwnerId, 'duyurdum_sana', postId);
        }
    } catch (error) {
        console.error('Error checking like badges:', error);
    }
};

// ─── Trigger: Kaydetme yapıldığında ───────────────────────
export const checkBadgesOnSave = async (
    userId: string
): Promise<void> => {
    try {
        // İlk kaydetme rozeti
        const userSaves = await getDocs(
            query(collection(db, 'posts'), where('saved_by', 'array-contains', userId))
        );
        if (userSaves.size <= 1) {
            await awardBadge(userId, 'ilk_kayit');
        }
    } catch (error) {
        console.error('Error checking save badges:', error);
    }
};

// ─── Trigger: Takip yapıldığında ──────────────────────────
export const checkBadgesOnFollow = async (
    followerId: string
): Promise<void> => {
    try {
        // El Uzatmış — 20 kişiyi takip
        const profileSnap = await getDoc(doc(db, 'profiles', followerId));
        const followingCount = profileSnap.data()?.following_count || 0;
        if (followingCount >= 20) {
            await awardBadge(followerId, 'el_uzatmis');
        }
    } catch (error) {
        console.error('Error checking follow badges:', error);
    }
};

// ─── Trigger: Profil tamamlandığında ──────────────────────
export const checkBadgesOnProfileUpdate = async (
    userId: string,
    profileData: any
): Promise<void> => {
    try {
        const isComplete = !!(
            (profileData.display_name || profileData.displayName) &&
            (profileData.avatar_url || profileData.avatarUrl || profileData.photoURL) &&
            profileData.bio &&
            profileData.username
        );

        if (isComplete) {
            await awardBadge(userId, 'profil_tamam');
        }
    } catch (error) {
        console.error('Error checking profile badges:', error);
    }
};

// ─── Trigger: Level up ────────────────────────────────────
export const checkBadgesOnLevelUp = async (
    userId: string,
    newLevel: number
): Promise<void> => {
    try {
        if (newLevel >= 10) {
            await awardBadge(userId, 'soframin_efendisi');
        }
    } catch (error) {
        console.error('Error checking level badges:', error);
    }
};
