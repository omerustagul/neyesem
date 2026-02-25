import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase';

export type DetectedIngredient = {
    name: string;
    confidence: number;
    category: string;
};

export type IngredientScan = {
    id: string;
    userId: string;
    imageUrl: string;
    detectedIngredients: DetectedIngredient[];
    suggestedRecipeIds: string[];
    status: 'processing' | 'completed' | 'failed';
    scannedAt: any;
};

export type UserPantry = {
    userId: string;
    ingredients: {
        name: string;
        addedAt: string;
        source: 'scan' | 'manual';
    }[];
    lastUpdated: string;
};

// Mutfak Dolabı Servisi
export const pantryService = {
    // Kullanıcının dolabını getir (Realtime)
    subscribeToPantry: (userId: string, callback: (pantry: UserPantry | null) => void) => {
        const docRef = doc(db, 'pantry', userId);
        return onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                callback(snap.data() as UserPantry);
            } else {
                callback(null);
            }
        });
    },

    // Malzeme ekle
    addIngredient: async (userId: string, name: string) => {
        const docRef = doc(db, 'pantry', userId);
        const snap = await getDoc(docRef);

        const newIngredient = {
            name: name.toLowerCase(),
            addedAt: new Date().toISOString(),
            source: 'manual'
        };

        if (!snap.exists()) {
            await setDoc(docRef, {
                userId,
                ingredients: [newIngredient],
                lastUpdated: new Date().toISOString()
            });
        } else {
            await updateDoc(docRef, {
                ingredients: arrayUnion(newIngredient),
                lastUpdated: new Date().toISOString()
            });
        }
    },

    // Malzeme sil
    removeIngredient: async (userId: string, ingredient: any) => {
        const docRef = doc(db, 'pantry', userId);
        await updateDoc(docRef, {
            ingredients: arrayRemove(ingredient),
            lastUpdated: new Date().toISOString()
        });
    },

    // Malzeme bazlı tarif eşleştirme (Deepened Logic)
    findMatchingRecipes: async (ingredients: string[]) => {
        if (ingredients.length === 0) return [];

        try {
            const postsRef = collection(db, 'posts');
            const q = query(
                postsRef,
                where('is_archived', '==', false),
                limit(100) // Get more to filter client-side
            );

            const snap = await getDocs(q);
            const matches = snap.docs
                .map(doc => {
                    const post = doc.data() as any;
                    const postIngredients: string[] = post.ingredients || [];
                    if (postIngredients.length === 0) return null;

                    const pantryNames = ingredients.map(i => i.toLowerCase());
                    const matchCount = postIngredients.filter(i =>
                        pantryNames.includes(i.toLowerCase())
                    ).length;

                    const score = matchCount / Math.max(postIngredients.length, 1);
                    const missingIngredients = postIngredients.filter(i =>
                        !pantryNames.includes(i.toLowerCase())
                    );

                    if (score === 0) return null;

                    return {
                        id: doc.id,
                        ...post,
                        matchScore: Math.round(score * 100),
                        missingCount: missingIngredients.length,
                        missingIngredients: missingIngredients.slice(0, 2)
                    };
                })
                .filter(p => p !== null)
                .sort((a, b) => b!.matchScore - a!.matchScore)
                .slice(0, 10);

            return matches;
        } catch (error) {
            console.error("Error finding matching recipes:", error);
            return [];
        }
    }
};

// AI Tarama Servisi
export const scanService = {
    // Tarama başlat
    startScan: async (userId: string, imageUrl: string) => {
        const scanRef = await addDoc(collection(db, 'ingredient_scans'), {
            userId,
            imageUrl,
            detectedIngredients: [],
            suggestedRecipeIds: [],
            status: 'processing',
            scannedAt: serverTimestamp()
        });
        return scanRef.id;
    },

    // Tarama sonucunu dinle
    subscribeToScan: (scanId: string, callback: (scan: IngredientScan) => void) => {
        return onSnapshot(doc(db, 'ingredient_scans', scanId), (snap) => {
            if (snap.exists()) {
                callback({ id: snap.id, ...snap.data() } as IngredientScan);
            }
        });
    }
};
