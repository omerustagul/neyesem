import { doc, updateDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { db } from '../api/firebase';

interface LevelState {
    level: number;
    xp: number;
    xpNextLevel: number;
    levelName: string;
    updateStats: (stats: { level: number; xp: number; xp_next_level: number }) => void;
    addXP: (userId: string, amount: number, onLevelUp?: (level: number, name: string) => void) => Promise<void>;
    syncToFirestore: (userId: string) => Promise<void>;
}

export const LEVEL_NAMES: Record<number, string> = {
    1: 'Düz Yiyici',
    2: 'Kaşıkçı',
    3: 'Ev Aşçısı',
    4: 'Usta Çırak',
    5: 'Sous Chef',
    6: 'Şef',
    7: 'Baş Şef',
    8: 'Gastronom',
    9: 'Gurme',
    10: 'Altın Çatal',
};

// Simple logic for next level XP requirement
const calculateNextXP = (currentLevel: number) => {
    return 100 + (currentLevel * 50);
};

export const useLevelStore = create<LevelState>((set, get) => ({
    level: 1,
    xp: 0,
    xpNextLevel: 150,
    levelName: 'Düz Yiyici',
    updateStats: (stats) => set({
        level: stats.level,
        xp: stats.xp,
        xpNextLevel: stats.xp_next_level,
        levelName: LEVEL_NAMES[stats.level] || 'Altın Çatal',
    }),
    addXP: async (userId, amount, onLevelUp) => {
        const state = get();
        let newXP = state.xp + amount;
        let newLevel = state.level;
        let newXPNext = state.xpNextLevel;
        let leveledUp = false;

        // Level up logic
        while (newXP >= newXPNext) {
            newXP -= newXPNext;
            newLevel += 1;
            newXPNext = calculateNextXP(newLevel);
            leveledUp = true;
        }

        const newLevelName = LEVEL_NAMES[newLevel] || 'Altın Çatal';

        set({
            level: newLevel,
            xp: newXP,
            xpNextLevel: newXPNext,
            levelName: newLevelName
        });

        if (leveledUp && onLevelUp) {
            onLevelUp(newLevel, newLevelName);
        }

        // Sync to database
        try {
            await updateDoc(doc(db, 'profiles', userId), {
                xp: newXP,
                level: newLevel,
                xp_next_level: newXPNext
            });
        } catch (error) {
            console.error('XP Sync Error:', error);
        }
    },
    syncToFirestore: async (userId) => {
        const { level, xp, xpNextLevel } = get();
        await updateDoc(doc(db, 'profiles', userId), {
            level,
            xp,
            xp_next_level: xpNextLevel,
        });
    },
}));
