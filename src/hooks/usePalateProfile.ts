import { useEffect, useState } from 'react';
import { PalateProfile, subscribeToPalateProfile } from '../api/palateService';
import { useAuthStore } from '../store/authStore';

export const usePalateProfile = () => {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState<PalateProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToPalateProfile(user.uid, (data) => {
            setProfile(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    return { profile, loading };
};
