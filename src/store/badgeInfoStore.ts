import { create } from 'zustand';

interface BadgeInfoState {
    selectedBadge: {
        type: 'level' | 'verification';
        level?: number;
    } | null;
    showBadgeInfo: (type: 'level' | 'verification', level?: number) => void;
    hideBadgeInfo: () => void;
}

export const useBadgeInfoStore = create<BadgeInfoState>((set) => ({
    selectedBadge: null,
    showBadgeInfo: (type, level) => set({ selectedBadge: { type, level } }),
    hideBadgeInfo: () => set({ selectedBadge: null }),
}));
