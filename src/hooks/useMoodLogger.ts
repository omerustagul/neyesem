import { addDoc, collection } from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuthStore } from '../store/authStore';

/**
 * Kullanıcının seçtiği modları loglar.
 */
export const useMoodLogger = () => {
    const { user } = useAuthStore();

    const logMoodSelection = async (moodId: string) => {
        if (!user) return;
        const now = new Date();

        // Fire and forget
        addDoc(collection(db, 'users', user.uid, 'moodLogs'), {
            moodId,
            selectedAt: now.toISOString(),
            dayOfWeek: now.getDay(),
            hour: now.getHours(),
        }).catch(() => { });
    };

    return { logMoodSelection };
};
