import { MOOD_MODES } from '../constants/moodModes';
import { MoodMode, PostMoodTags } from '../types/mood.types';

/**
 * Bir post için tüm modların skorunu hesaplar.
 * Sonuçlar post.moodTags.moodScores alanına yazılır.
 */
export const calculateMoodScores = (
    caption: string,
    tags: string[],
    ingredients: string[],
    moodTags: Partial<PostMoodTags>
): Record<string, number> => {

    const scores: Record<string, number> = {};
    const fullText = [caption, ...tags, ...ingredients]
        .join(' ')
        .toLowerCase()
        .replace(/[^a-zğüşöçıA-ZĞÜŞÖÇİ0-9 ]/g, '');

    for (const mode of MOOD_MODES) {
        const w = mode.vector.weights;

        // 1. Keyword skoru (0-1)
        const keywordMatches = mode.vector.keywords.filter(kw =>
            fullText.includes(kw.toLowerCase())
        ).length;
        const keywordScore = Math.min(keywordMatches / Math.max(mode.vector.keywords.length * 0.3, 1), 1);

        // 2. Ortam skoru (0-1)
        const ortamMatches = (moodTags.ortam ?? []).filter(o =>
            mode.vector.ortam.includes(o as any)
        ).length;
        const ortamScore = ortamMatches > 0 ? Math.min(ortamMatches / mode.vector.ortam.length, 1) : 0;

        // 3. Zaman skoru (0-1)
        const zamanMatches = (moodTags.zaman ?? []).filter(z =>
            mode.vector.zaman.includes(z as any)
        ).length;
        const zamanScore = zamanMatches > 0 ? Math.min(zamanMatches / mode.vector.zaman.length, 1) : 0;

        // 4. Enerji skoru (0-1)
        const enerjiMatches = (moodTags.enerji ?? []).filter(e =>
            mode.vector.enerji.includes(e as any)
        ).length;
        const energiScore = enerjiMatches > 0 ? Math.min(enerjiMatches / mode.vector.enerji.length, 1) : 0;

        // 5. Duygu skoru (0-1)
        const duyguMatches = (moodTags.duygu ?? []).filter(d =>
            mode.vector.duygu.includes(d as any)
        ).length;
        const duyguScore = duyguMatches > 0 ? Math.min(duyguMatches / mode.vector.duygu.length, 1) : 0;

        // Ağırlıklı toplam
        scores[mode.id] = parseFloat((
            keywordScore * w.keyword +
            ortamScore * w.ortam +
            zamanScore * w.zaman +
            energiScore * w.enerji +
            duyguScore * w.duygu
        ).toFixed(3));
    }

    return scores;
};

/**
 * Belirli bir saat ve güne göre hangi modun öne çıkacağını belirler.
 */
export const getSuggestedMood = (hour: number, dayOfWeek: number): MoodMode | null => {
    const candidates = MOOD_MODES.filter(mode => {
        const t = mode.dynamicTrigger;
        if (!t) return false;
        const hourMatch = !t.hours || t.hours.includes(hour);
        const dayMatch = !t.days || t.days.includes(dayOfWeek);
        return hourMatch && dayMatch;
    });

    if (candidates.length === 0) return null;
    // Birden fazla eşleşirse öncelik sırasına göre ilkini döndür
    return candidates[0];
};
