import { create } from 'zustand';

interface NavigationState {
    activeTab: 'Feed' | 'Explore' | 'Pantry' | 'Lists' | 'Profile';
    setActiveTab: (tab: 'Feed' | 'Explore' | 'Pantry' | 'Lists' | 'Profile') => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    activeTab: 'Feed',
    setActiveTab: (tab) => set({ activeTab: tab }),
}));
