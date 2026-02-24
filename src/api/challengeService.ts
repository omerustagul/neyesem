import {
    doc,
    increment,
    onSnapshot,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

export type ChallengeType =
    | 'cook_and_share'
    | 'discover_cuisine'
    | 'ingredient_focus'
    | 'technique_master'
    | 'local_find'
    | 'chain_starter'
    | 'embed_curate'
    | 'speed_cook';

export interface Challenge {
    id: string;
    weekId: string;
    type: ChallengeType;
    title: string;
    description: string;
    targetCuisine?: string;
    targetIngredient?: string;
    xpReward: number;
    badgeReward?: string;
    participantCount: number;
    deadline: any;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserChallengeProgress {
    challengeId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'missed';
    startedAt?: any;
    completedAt?: any;
    postId?: string;
    xpEarned: number;
}

export const getCurrentWeekId = () => {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
};

export const subscribeToGlobalChallenge = (callback: (challenge: Challenge | null) => void) => {
    const weekId = getCurrentWeekId();
    const challengeRef = doc(db, 'challenges', weekId);

    return onSnapshot(challengeRef, (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() } as Challenge);
        } else {
            // Seed a default challenge if none exists for this week
            const defaultChallenge: Partial<Challenge> = {
                weekId,
                type: 'discover_cuisine',
                title: 'Türk Mutfağı Haftası 🇹🇷',
                description: 'Bu hafta en sevdiğin yerel mutfaktan veya ev yemeğinden bir lezzet paylaş!',
                xpReward: 150,
                participantCount: 124,
                difficulty: 'easy',
                deadline: new Date(Date.now() + 86400000 * 3), // 3 days from now
            };
            setDoc(challengeRef, defaultChallenge);
            callback({ id: weekId, ...defaultChallenge } as Challenge);
        }
    });
};

export const subscribeToUserChallengeProgress = (userId: string, callback: (progress: UserChallengeProgress | null) => void) => {
    const weekId = getCurrentWeekId();
    const progressRef = doc(db, 'profiles', userId, 'challenges', weekId);

    return onSnapshot(progressRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data() as UserChallengeProgress);
        } else {
            callback(null);
        }
    });
};

export const startChallenge = async (userId: string) => {
    const weekId = getCurrentWeekId();
    const progressRef = doc(db, 'profiles', userId, 'challenges', weekId);

    await setDoc(progressRef, {
        challengeId: weekId,
        status: 'in_progress',
        startedAt: serverTimestamp(),
        xpEarned: 0,
    });
};

export const completeChallenge = async (userId: string, postId: string, xpReward: number) => {
    const weekId = getCurrentWeekId();
    const progressRef = doc(db, 'profiles', userId, 'challenges', weekId);

    await updateDoc(progressRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        postId,
        xpEarned: xpReward,
    });

    // Update user profile XP
    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, {
        xp: increment(xpReward),
    });
};
