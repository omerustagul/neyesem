import { User, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../api/firebase';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    signOut: async () => {
        try {
            await firebaseSignOut(auth);
            set({ user: null });
        } catch (error) {
            console.error('Sign out error:', error);
        }
    },
}));

// Initialize listener
onAuthStateChanged(auth, (user) => {
    useAuthStore.getState().setUser(user);
});
