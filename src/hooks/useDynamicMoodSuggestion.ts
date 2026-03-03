import { useMemo } from 'react';
import { MoodMode } from '../types/mood.types';
import { getSuggestedMood } from '../utils/moodScoreCalculator';

/**
 * Şu anki saat ve güne göre otomatik mod önerisi yapar.
 */
export const useDynamicMoodSuggestion = (): MoodMode | null => {
    return useMemo(() => {
        const now = new Date();
        return getSuggestedMood(now.getHours(), now.getDay());
    }, [
        // Saate göre memoize et — her saat başı güncellenir
        Math.floor(Date.now() / (60 * 60 * 1000)),
    ]);
};
