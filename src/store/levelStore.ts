import { doc, updateDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { db } from '../api/firebase';

interface LevelState {
    level: number;
    xp: number;
    xpNextLevel: number;
    levelName: string;
    updateStats: (stats: { level: number; xp: number; xp_next_level: number }) => void;
    syncToFirestore: (userId: string) => Promise<void>;
}

const LEVEL_NAMES: Record<number, string> = {
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

export const useLevelStore = create<LevelState>((set, get) => ({
    level: 1,
    xp: 0,
    xpNextLevel: 150,
    levelName: 'Düz Yiyici',
    updateStats: (stats) => set({
        level: stats.level,
        xp: stats.xp,
        xpNextLevel: stats.xp_next_level,
        levelName: LEVEL_NAMES[stats.level] || 'Gurme',
    }),
    syncToFirestore: async (userId) => {
        const { level, xp, xpNextLevel } = get();
        await updateDoc(doc(db, 'profiles', userId), {
            level,
            xp,
            xp_next_level: xpNextLevel,
        });
    },
}));
