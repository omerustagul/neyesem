import { create } from 'zustand';

interface NavigationState {
    activeTab: 'Feed' | 'Explore' | 'Lists' | 'Profile';
    setActiveTab: (tab: 'Feed' | 'Explore' | 'Lists' | 'Profile') => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    activeTab: 'Feed',
    setActiveTab: (tab) => set({ activeTab: tab }),
}));
