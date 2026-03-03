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
 * Seçilen mutfağa göre Firestore'dan içerik çeker.
 * AI Damak Profili ile kişiselleştirme katmanı ekler.
 */
export const useCuisineFeed = (cuisineTag: string | null) => {
    const { profile } = usePalateProfile();

    return useInfiniteQuery({
        queryKey: ['cuisineFeed', cuisineTag, profile?.palatePersona],
        enabled: !!cuisineTag,
        initialPageParam: undefined as DocumentSnapshot | undefined,

        queryFn: async ({ pageParam }: { pageParam?: DocumentSnapshot }) => {
            if (!cuisineTag) return { posts: [], lastDoc: null };

            let q = query(
                collection(db, 'posts'),
                where('tags', 'array-contains', cuisineTag),
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
        staleTime: 5 * 60 * 1000, // 5 dakika cache
    });
};

/**
 * Damak profili bazlı önceliklendirme.
 */
const personalizePosts = (posts: any[], profile: any) => {
    if (!profile) return posts;

    // Eğer kullanıcının damak tadına çok uygunsa üste taşı
    return [...posts].sort((a, b) => {
        const aFlavorMatch = getFlavorMatchScore(a.tags ?? [], profile);
        const bFlavorMatch = getFlavorMatchScore(b.tags ?? [], profile);
        return bFlavorMatch - aFlavorMatch;
    });
};

const getFlavorMatchScore = (tags: string[], profile: any): number => {
    if (!profile?.flavorProfile) return 0;
    let score = 0;
    for (const [flavor, weight] of Object.entries(profile.flavorProfile)) {
        if ((weight as number) > 70 && tags.some(t => t.toLowerCase().includes(flavor.toLowerCase()))) {
            score += 1;
        }
    }
    return score;
};
