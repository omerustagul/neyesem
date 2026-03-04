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
import { auth, db } from './firebase';
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

        if (existing.exists()) return false;

        const badge = BADGES.find(b => b.id === badgeId);
        if (!badge) return false;

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
        } catch (_) { }

        // Bildirim gönder
        try {
            const profileSnap = await getDoc(doc(db, 'profiles', userId));
            const profileData = profileSnap.data();

            // Use user's own profile for the notification sender
            const senderData = {
                uid: userId,
                username: profileData?.username || auth.currentUser?.displayName || 'Ben',
                avatar_url: profileData?.avatar_url || profileData?.photoURL || auth.currentUser?.photoURL || '',
                is_verified: profileData?.is_verified || false,
                level: profileData?.level || 1
            };

            await createNotification(
                userId,
                senderData as any,
                'badge_earned' as any,
                `Yeni Rozet: ${badge.name} — "${badge.description}"`,
                undefined,
                { badgeId }
            );
        } catch (_) { }

        console.log(`🏅 Badge awarded: ${badge.name} to ${userId}`);
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
        const userComments = await getDocs(
            query(collection(db, 'comments'), where('userId', '==', userId))
        );

        // İlk yorum
        if (userComments.size <= 1) {
            await awardBadge(userId, 'ilk_yorum');
        }

        // Mahalle Bakkalı — 50 yorum (absolute progress update)
        const progressRef = doc(db, 'users', userId, 'badgeProgress', 'mahalle_bakkali');
        await setDoc(progressRef, {
            badgeId: 'mahalle_bakkali',
            current: userComments.size,
            target: 50,
            lastUpdated: new Date().toISOString(),
        }, { merge: true });

        if (userComments.size >= 50) {
            await awardBadge(userId, 'mahalle_bakkali');
        }
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
        // Sadece userId ile sorgula — bileşik index gerektirmez
        const userPosts = await getDocs(
            query(collection(db, 'posts'), where('userId', '==', userId))
        );
        // is_archived filtresini client-side yap
        const activePosts = userPosts.docs.filter(d => d.data().is_archived !== true);

        // İlk gönderi
        if (activePosts.length <= 1) {
            await awardBadge(userId, 'ilk_gonderi', postId);
        }

        // Hız Şefi — 30 günde 30 gönderi
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentPosts = activePosts.filter(d => {
            const ca = d.data().created_at;
            return ca?.toDate && ca.toDate() >= thirtyDaysAgo;
        });
        if (recentPosts.length >= 30) {
            await awardBadge(userId, 'hiz_sefi', postId);
        }

        // Gece Kuşu — gece yarısı
        const hour = new Date().getHours();
        if (hour >= 23 || hour <= 2) {
            await incrementProgress(userId, 'gece_kusu', 7, postId);
        }

        // Damak Ateşi — acı meydan okuma
        if (postData?.moodScores?.aci_meydan_okuma && postData.moodScores.aci_meydan_okuma >= 0.5) {
            await incrementProgress(userId, 'damak_atesi', 5, postId);
        }

        // Lezzet Gezgini — 5 farklı mutfak
        if (postData?.cuisineId) {
            const uniqueCuisines = new Set<string>();
            activePosts.forEach(d => {
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
        // İlk beğeni — progress doc ile kontrol
        const progressRef = doc(db, 'users', likerId, 'badgeProgress', 'ilk_begeni');
        const snap = await getDoc(progressRef);
        if (!snap.exists()) {
            await setDoc(progressRef, {
                badgeId: 'ilk_begeni', current: 1, target: 1,
                lastUpdated: new Date().toISOString(),
            });
            await awardBadge(likerId, 'ilk_begeni');
        }

        // Duyurdum Sana — 100 beğeni
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
        const progressRef = doc(db, 'users', userId, 'badgeProgress', 'ilk_kayit');
        const snap = await getDoc(progressRef);
        if (!snap.exists()) {
            await setDoc(progressRef, {
                badgeId: 'ilk_kayit', current: 1, target: 1,
                lastUpdated: new Date().toISOString(),
            });
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

// ─── Retroactive: Mevcut kullanıcılar için tüm rozetleri kontrol et ───
/**
 * Kullanıcının mevcut Firestore verisine bakarak kazanması gereken
 * rozetleri retroaktif olarak verir. Sadece BASİT tek-alan sorguları
 * kullanır (composite index gerektirmez). Client-side filtreleme yapılır.
 * `awardBadge` tekrar koruma sağladığından birden fazla çalıştırılabilir.
 */
export const runRetroactiveBadgeCheck = async (userId: string): Promise<void> => {
    try {
        console.log(`🏅 Starting retroactive badge check for ${userId}`);

        // ── Profil yükle ────────────────────────────────────
        const profileSnap = await getDoc(doc(db, 'profiles', userId));
        const profile = profileSnap.data() || {};

        // ── Gönderiler: sadece userId sorgusu ───────────────
        const postsSnap = await getDocs(
            query(collection(db, 'posts'), where('userId', '==', userId))
        );
        const activePosts = postsSnap.docs.filter(d => d.data().is_archived !== true);
        console.log(`📝 Found ${activePosts.length} active posts`);

        // 1. İlk Gönderi
        if (activePosts.length >= 1) await awardBadge(userId, 'ilk_gonderi');

        // 2. Hız Şefi — 30 günde 30 gönderi
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCount = activePosts.filter(d => {
            const ca = d.data().created_at;
            return ca?.toDate && ca.toDate() >= thirtyDaysAgo;
        }).length;
        if (recentCount >= 30) await awardBadge(userId, 'hiz_sefi');

        // 3. Lezzet Gezgini — 5 farklı mutfak
        const cuisines = new Set<string>();
        postsSnap.docs.forEach(d => {
            const cId = d.data().cuisineId || d.data().foodCategory;
            if (cId) cuisines.add(String(cId));
        });
        if (cuisines.size >= 5) await awardBadge(userId, 'lezzet_gezgini');

        // ── Yorumlar: sadece userId sorgusu ─────────────────
        const commentsSnap = await getDocs(
            query(collection(db, 'comments'), where('userId', '==', userId))
        );
        console.log(`💬 Found ${commentsSnap.size} comments`);

        // 4. İlk Yorum
        if (commentsSnap.size >= 1) await awardBadge(userId, 'ilk_yorum');

        // 5. Mahalle Bakkalı — 50 yorum
        const commentProgressRef = doc(db, 'users', userId, 'badgeProgress', 'mahalle_bakkali');
        await setDoc(commentProgressRef, {
            badgeId: 'mahalle_bakkali',
            current: commentsSnap.size,
            target: 50,
            lastUpdated: new Date().toISOString(),
        }, { merge: true });
        if (commentsSnap.size >= 50) await awardBadge(userId, 'mahalle_bakkali');

        // 6. El Uzatmış — 20 takip (profilden oku)
        const followingCount = profile.following_count || 0;
        if (followingCount >= 20) await awardBadge(userId, 'el_uzatmis');

        // 7. Duyurdum Sana — gönderilerden birinin 100 beğenisi var mı?
        const highLikePost = postsSnap.docs.find(d => (d.data().likes_count || 0) >= 100);
        if (highLikePost) await awardBadge(userId, 'duyurdum_sana', highLikePost.id);

        // 8. Profil Tamam
        if (
            (profile.display_name || profile.displayName) &&
            (profile.avatar_url || profile.photoURL) &&
            profile.bio &&
            profile.username
        ) {
            await awardBadge(userId, 'profil_tamam');
        }

        // 9. Sofranın Efendisi — Level 10
        if ((profile.level || 1) >= 10) await awardBadge(userId, 'soframin_efendisi');

        // 10. İlk Beğeni — progress doc veya profildeki like sayısı
        const likeProgressRef = doc(db, 'users', userId, 'badgeProgress', 'ilk_begeni');
        const likeProgressSnap = await getDoc(likeProgressRef);
        const likedCount = profile.liked_count || profile.likes_given || 0;
        if (likedCount >= 1 || likeProgressSnap.exists()) {
            await awardBadge(userId, 'ilk_begeni');
        }

        // 11. İlk Kayıt — progress doc veya profildeki save sayısı
        const saveProgressRef = doc(db, 'users', userId, 'badgeProgress', 'ilk_kayit');
        const saveProgressSnap = await getDoc(saveProgressRef);
        const savedCount = profile.saved_count || profile.saves_given || 0;
        if (savedCount >= 1 || saveProgressSnap.exists()) {
            await awardBadge(userId, 'ilk_kayit');
        }

        console.log(`✅ Retroactive badge check complete for ${userId}`);
    } catch (error) {
    }
};
