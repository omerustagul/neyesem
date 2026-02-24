import {
    addDoc,
    collection,
    doc,
    getDoc,
    increment,
    onSnapshot,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

export type UserSignalType =
    | 'view_under_3s'
    | 'view_3_to_10s'
    | 'view_over_10s'
    | 'like'
    | 'save'
    | 'comment'
    | 'share'
    | 'recipe_started'
    | 'recipe_completed'
    | 'scroll_past';

export interface UserSignal {
    type: UserSignalType;
    postId: string;
    postTags: string[];
    createdAt: any;
}

export interface PalateProfile {
    userId: string;
    cuisines: {
        turkish: number;
        asian: number;
        italian: number;
        mediterranean: number;
        streetFood: number;
        homeCooking: number;
        fineDining: number;
        vegan: number;
        [key: string]: number;
    };
    flavorProfile: {
        spicy: number;
        sweet: number;
        savory: number;
        sour: number;
        rich: number;
        light: number;
        [key: string]: number;
    };
    contentPreferences: {
        quickRecipes: number;
        elaborateRecipes: number;
        videoContent: number;
        embedContent: number;
        originalPosts: number;
    };
    mealPatterns: {
        breakfast: boolean;
        lunch: boolean;
        dinner: boolean;
        lateNight: boolean;
        snack: boolean;
    };
    dominantTaste: string;
    palatePersona: string;
    lastUpdated: string;
    signalCount: number;
}

export const PALATE_PERSONAS = [
    {
        id: 'adventurous_explorer',
        name: '🌍 Maceracı Kaşif',
        description: 'Her mutfaktan bir şeyler dener, alışılmışın dışına çıkar',
        triggerCondition: (p: PalateProfile) =>
            Object.values(p.cuisines).filter(v => typeof v === 'number' && v > 40).length >= 5,
    },
    {
        id: 'spice_hunter',
        name: '🌶️ Acı Avcısı',
        description: 'Ne kadar acı olursa o kadar iyi',
        triggerCondition: (p: PalateProfile) => (p.flavorProfile.spicy || 0) > 75,
    },
    {
        id: 'comfort_cook',
        name: '🏠 Konfor Aşçısı',
        description: 'Ev yemeklerinin sıcaklığını ve otantikliğini sever',
        triggerCondition: (p: PalateProfile) =>
            (p.cuisines.homeCooking || 0) > 70 && (p.flavorProfile.rich || 0) > 60,
    },
    {
        id: 'street_soul',
        name: '🛵 Sokak Ruhu',
        description: 'En iyi yemekler kaldırım kenarında bulunur',
        triggerCondition: (p: PalateProfile) => (p.cuisines.streetFood || 0) > 70,
    },
    {
        id: 'zen_eater',
        name: '🍃 Sade & Sağlıklı',
        description: 'Temiz malzeme, saf lezzet',
        triggerCondition: (p: PalateProfile) =>
            (p.flavorProfile.light || 0) > 70 && (p.cuisines.vegan || 0) > 50,
    },
    {
        id: 'gourmet_soul',
        name: '⚜️ Gurme Ruhu',
        description: 'Detaylara takılır, lezzetin arkasındaki hikayeyi arar',
        triggerCondition: (p: PalateProfile) => (p.cuisines.fineDining || 0) > 65,
    },
];

const SIGNAL_WEIGHTS: Record<UserSignalType, number> = {
    view_under_3s: 2,
    view_3_to_10s: 5,
    view_over_10s: 12,
    like: 15,
    save: 25,
    comment: 20,
    share: 30,
    recipe_started: 35,
    recipe_completed: 50,
    scroll_past: -3,
};

const INITIAL_PALATE: PalateProfile = {
    userId: '',
    cuisines: { turkish: 0, asian: 0, italian: 0, mediterranean: 0, streetFood: 0, homeCooking: 0, fineDining: 0, vegan: 0 },
    flavorProfile: { spicy: 0, sweet: 0, savory: 0, sour: 0, rich: 0, light: 0 },
    contentPreferences: { quickRecipes: 0, elaborateRecipes: 0, videoContent: 0, embedContent: 0, originalPosts: 0 },
    mealPatterns: { breakfast: false, lunch: false, dinner: false, lateNight: false, snack: false },
    dominantTaste: 'Henüz Keşfedilmedi',
    palatePersona: 'Henüz Atanmadı',
    lastUpdated: new Date().toISOString(),
    signalCount: 0,
};

export const subscribeToPalateProfile = (userId: string, callback: (profile: PalateProfile) => void) => {
    const profileRef = doc(db, 'profiles', userId, 'palate', 'current');

    return onSnapshot(profileRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data() as PalateProfile);
        } else {
            // Initialize if doesn't exist
            setDoc(profileRef, { ...INITIAL_PALATE, userId }).then(() => {
                callback({ ...INITIAL_PALATE, userId });
            });
        }
    });
};

const updatePalateScore = (currentScore: number, weight: number, alpha: number = 0.15): number => {
    return (currentScore || 0) * (1 - alpha) + weight * alpha;
};

export const sendPalateSignal = async (
    userId: string,
    type: UserSignalType,
    postId: string,
    postTags: string[] = []
) => {
    try {
        // Log signal
        await addDoc(collection(db, 'profiles', userId, 'signals'), {
            type,
            postId,
            postTags,
            createdAt: serverTimestamp(),
        });

        // In a real production app, this would be a Cloud Function.
        // For this demo/assistant task, we'll update it client-side since we can't deploy Cloud Functions.
        const profileRef = doc(db, 'profiles', userId, 'palate', 'current');
        const snap = await getDoc(profileRef);
        let profile = (snap.exists() ? snap.data() : { ...INITIAL_PALATE, userId }) as PalateProfile;

        const weight = SIGNAL_WEIGHTS[type];
        const updates: any = {
            signalCount: increment(1),
            lastUpdated: new Date().toISOString(),
        };

        // Update scores based on tags
        postTags.forEach(tag => {
            const normalizedTag = tag.toLowerCase();
            if (normalizedTag in profile.cuisines) {
                updates[`cuisines.${normalizedTag}`] = updatePalateScore(profile.cuisines[normalizedTag], weight);
            }
            if (normalizedTag in profile.flavorProfile) {
                updates[`flavorProfile.${normalizedTag}`] = updatePalateScore(profile.flavorProfile[normalizedTag], weight);
            }
        });

        // Dominant taste calculation
        const allScores = { ...profile.cuisines, ...profile.flavorProfile };
        let dominant = profile.dominantTaste;
        let maxScore = 0;
        Object.entries(allScores).forEach(([key, val]) => {
            if (typeof val === 'number' && val > maxScore) {
                maxScore = val;
                dominant = key.charAt(0).toUpperCase() + key.slice(1);
            }
        });
        updates.dominantTaste = dominant;

        // Persona logic
        if (profile.signalCount >= 5) { // Lowered for demo/faster feedback
            const newPersona = PALATE_PERSONAS.find(p => p.triggerCondition({ ...profile, ...updates } as PalateProfile));
            if (newPersona && newPersona.id !== profile.palatePersona) {
                updates.palatePersona = newPersona.id;
            }
        }

        await updateDoc(profileRef, updates);
    } catch (error) {
        console.error('Error sending palate signal:', error);
    }
};

export const getPalatePersona = (personaId: string) => {
    return PALATE_PERSONAS.find(p => p.id === personaId) || { name: 'Yeni Kaşif', description: 'Lezzet yolculuğuna yeni başladı.' };
};
