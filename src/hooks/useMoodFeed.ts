import { useInfiniteQuery } from '@tanstack/react-query';
import {
    collection,
    DocumentSnapshot,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { usePalateProfile } from './usePalateProfile';

/**
 * Seçilen moda göre Firestore'dan içerik çeker.
 * AI Damak Profili ile kişiselleştirme katmanı ekler.
 */
export const useMoodFeed = (moodId: string | null) => {
    const { profile } = usePalateProfile();

    return useInfiniteQuery({
        queryKey: ['moodFeed', moodId, profile?.palatePersona],
        enabled: !!moodId,
        initialPageParam: undefined as DocumentSnapshot | undefined,

        queryFn: async ({ pageParam }: { pageParam?: DocumentSnapshot }) => {
            if (!moodId) return { posts: [], lastDoc: null };

            const scoreField = `moodTags.moodScores.${moodId}`;
            const MIN_SCORE = 0.35; // Bu eşiğin altındaki içerikler gösterilmez

            let q = query(
                collection(db, 'posts'),
                where('moodTags.isTagged', '==', true),
                where(scoreField, '>=', MIN_SCORE),
                orderBy(scoreField, 'desc'),
                orderBy('likeCount', 'desc'),
                limit(12)
            );

            // Sayfalama
            if (pageParam) {
                q = query(q as any, startAfter(pageParam));
            }

            const snap = await getDocs(q);
            const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const lastDoc = snap.docs[snap.docs.length - 1] ?? null;

            // Damak profili kişiselleştirmesi
            const personalizedPosts = personalizePosts(posts, profile);

            return { posts: personalizedPosts, lastDoc };
        },

        getNextPageParam: (lastPage) => lastPage.lastDoc ?? undefined,
        staleTime: 3 * 60 * 1000, // 3 dakika cache
    });
};

/**
 * Damak profili bazlı sıralama.
 */
const personalizePosts = (posts: any[], profile: any) => {
    if (!profile) return posts;

    return [...posts].sort((a, b) => {
        // Kullanıcının güçlü olduğu mutfak bonusu
        const aBonus = getCuisineBonus(a.tags ?? [], profile);
        const bBonus = getCuisineBonus(b.tags ?? [], profile);

        return (bBonus) - (aBonus);
    });
};

const getCuisineBonus = (tags: string[], profile: any): number => {
    if (!profile?.cuisines) return 0;
    let bonus = 0;
    for (const [cuisine, score] of Object.entries(profile.cuisines)) {
        if ((score as number) > 60 && tags.some(t => t.toLowerCase().includes(cuisine.toLowerCase()))) {
            bonus += 0.1;
        }
    }
    return Math.min(bonus, 0.3); // Maksimum 0.3 bonus
};
