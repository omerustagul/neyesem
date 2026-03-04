import { doc, updateDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { checkBadgesOnLevelUp } from '../api/badgeService';
import { db } from '../api/firebase';
// Level cap configuration
const MAX_LEVEL = 10;
const MAX_XP = 5000;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

import { Award, ChefHat, MessageCircle, MoreHorizontal, ShieldCheck, Sparkles, Star, TrendingUp, Trophy, Zap } from 'lucide-react-native';

// Unified Level thresholds matching UI (AnimatedLevelCard)
export const LEVEL_DATA = [
    { level: 1, name: 'Düz Yiyici', xpRequired: 0, perks: ['Keşfet Erişimi', 'Profil Oluşturma'], rewards: ['Hoşgeldin Rozeti'] },
    { level: 2, name: 'Kaşıkçı', xpRequired: 150, perks: ['Tariflere Yorum Yapma', 'Beğeni Gönderme'], rewards: ['Gümüş Kaşık Rozeti'] },
    { level: 3, name: 'Ev Aşçısı', xpRequired: 350, perks: ['Kendi Listelerini Oluştur', 'Favoriler'], rewards: ['250 XP Bonus'] },
    { level: 4, name: 'Usta Çırak', xpRequired: 700, perks: ['Görüntülü Tarif Paylaşma', 'Yorumlarda Görsel'], rewards: ['Özel Önlük Rozeti'] },
    { level: 5, name: 'Sous Chef', xpRequired: 1200, perks: ['Hikaye Paylaşma', 'Profil Rozeti'], rewards: ['Mutfak Yıldızı Rozeti'] },
    { level: 6, name: 'Şef', xpRequired: 2200, perks: ['Özel Şef Rozeti', 'Mesajlaşma'], rewards: ['Şef Şapkası Rozeti'] },
    { level: 7, name: 'Baş Şef', xpRequired: 4000, perks: ['Çırak Eğitim Yetkisi', 'Öncelikli Keşfet'], rewards: ['Mavi Kordon Gözetmenliği'] },
    { level: 8, name: 'Gastronom', xpRequired: 7000, perks: ['Özel Profil Temaları', 'Gelişmiş Analitik'], rewards: ['Yemek Bilgini Rozeti'] },
    { level: 9, name: 'Gurme', xpRequired: 11000, perks: ['Usta Onaylı Rozet', 'Beta Özellikler'], rewards: ['Damak Tadı Gurusu Ünvanı'] },
    { level: 10, name: 'Altın Çatal', xpRequired: 20000, perks: ['Neyesem Elçilik Statüsü', 'Altın Kullanıcı Adı'], rewards: ['Efsanevi Altın Çatal'] },
];

export const PERK_ICONS: Record<string, React.ComponentType<any>> = {
    'Keşfet Erişimi': Star,
    'Profil Oluşturma': Star,
    'Tariflere Yorum Yapma': MessageCircle,
    'Beğeni Gönderme': Star,
    'Kendi Listelerini Oluştur': TrendingUp,
    'Favoriler': Star,
    'Görüntülü Tarif Paylaşma': ChefHat,
    'Yorumlarda Görsel': MoreHorizontal,
    'Hikaye Paylaşma': Sparkles,
    'Profil Rozeti': ShieldCheck,
    'Özel Şef Rozeti': Award,
    'Mesajlaşma': MessageCircle,
    'Çırak Eğitim Yetkisi': Award,
    'Öncelikli Keşfet': Zap,
    'Özel Profil Temaları': Sparkles,
    'Gelişmiş Analitik': TrendingUp,
    'Usta Onaylı Rozet': ShieldCheck,
    'Beta Özellikler': Zap,
    'Neyesem Elçilik Statüsü': Trophy,
    'Altın Kullanıcı Adı': Award,
};

export const LEVEL_COLORS: Record<number, { primary: string; secondary: string; light: string }> = {
    1: { primary: '#94a3b8', secondary: '#64748b', light: 'rgba(148,163,184,0.1)' },
    2: { primary: '#d97706', secondary: '#92400e', light: 'rgba(217,119,6,0.1)' },
    3: { primary: '#94a3b8', secondary: '#475569', light: 'rgba(148,163,184,0.15)' },
    4: { primary: '#fbbf24', secondary: '#b45309', light: 'rgba(251,191,36,0.15)' },
    5: { primary: '#2dd4bf', secondary: '#0f766e', light: 'rgba(45,212,191,0.15)' },
    6: { primary: '#10b981', secondary: '#047857', light: 'rgba(16,185,129,0.15)' },
    7: { primary: '#3b82f6', secondary: '#1d4ed8', light: 'rgba(59,130,246,0.15)' },
    8: { primary: '#8b5cf6', secondary: '#6d28d9', light: 'rgba(139,92,246,0.15)' },
    9: { primary: '#ef4444', secondary: '#b91c1c', light: 'rgba(239,68,68,0.15)' },
    10: { primary: '#f59e0b', secondary: '#d97706', light: 'rgba(245,158,11,0.2)' },
};

interface LevelState {
    level: number;
    xp: number;
    xpNextLevel: number;
    levelName: string;
    pendingLevelUp: { level: number; name: string } | null;
    clearLevelUp: () => void;
    updateStats: (userId: string, stats: { level: number; xp: number; xp_next_level: number }) => void;
    addXP: (userId: string, amount: number) => Promise<void>;
}

const getLevelInfo = (lvl: number) => {
    return LEVEL_DATA.find(d => d.level === lvl) || LEVEL_DATA[0];
};

const getNextLevelXP = (lvl: number) => {
    const next = LEVEL_DATA.find(d => d.level === lvl + 1);
    return next ? next.xpRequired : LEVEL_DATA[LEVEL_DATA.length - 1].xpRequired;
};

export const useLevelStore = create<LevelState>((set, get) => ({
    level: 1,
    xp: 0,
    xpNextLevel: 150,
    levelName: 'Düz Yiyici',
    pendingLevelUp: null,

    clearLevelUp: () => set({ pendingLevelUp: null }),

    updateStats: (userId, stats) => {
        if (!stats) return;
        const currentXP = stats.xp;
        let detectedLevel = stats.level;
        let xpForNext = getNextLevelXP(detectedLevel);

        // Retroactive Level Calculation
        let changed = false;
        while (detectedLevel < MAX_LEVEL) {
            const nextThreshold = getNextLevelXP(detectedLevel);
            if (currentXP >= nextThreshold) {
                detectedLevel++;
                xpForNext = getNextLevelXP(detectedLevel);
                changed = true;
            } else {
                break;
            }
        }

        const info = getLevelInfo(detectedLevel);

        set({
            level: detectedLevel,
            xp: currentXP,
            xpNextLevel: xpForNext,
            levelName: info.name,
            // If Level changed during sync (like the user with 253 XP stuck at level 2)
            pendingLevelUp: changed ? { level: detectedLevel, name: info.name } : get().pendingLevelUp
        });

        if (changed) {
            updateDoc(doc(db, 'profiles', userId), {
                level: detectedLevel,
                xp_next_level: xpForNext
            }).catch(console.error);
            checkBadgesOnLevelUp(userId, detectedLevel).catch(() => { });
        }
    },

    addXP: async (userId, amount) => {
        const state = get();
        let newXP = state.xp + amount;
        let newLevel = state.level;
        let newXPNext = state.xpNextLevel;
        let leveledUp = false;

        while (newLevel < MAX_LEVEL) {
            const nextThreshold = getNextLevelXP(newLevel);
            if (newXP >= nextThreshold) {
                newLevel++;
                newXPNext = getNextLevelXP(newLevel);
                leveledUp = true;
            } else {
                break;
            }
        }

        const info = getLevelInfo(newLevel);

        set({
            level: newLevel,
            xp: newXP,
            xpNextLevel: newXPNext,
            levelName: info.name,
            pendingLevelUp: leveledUp ? { level: newLevel, name: info.name } : state.pendingLevelUp
        });

        if (leveledUp) {
            checkBadgesOnLevelUp(userId, newLevel).catch(() => { });
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
}));

