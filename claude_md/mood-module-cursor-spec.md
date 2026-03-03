# 🎭 Ruh Hali Modu — Teknik Implementasyon Rehberi
## Neyesem Uygulaması · Keşfet Ekranı Mood Sistemi

> **Bu döküman bir AI kod editörü için hazırlanmıştır.**
> Aşağıdaki spesifikasyonu baştan sona uygula. Belirsiz kalan hiçbir nokta yok,
> her adım sırasıyla implement edilmelidir. Mevcut proje yapısına entegre et.

---

## 📁 Proje Bağlamı

```
Teknoloji yığını:
- React Native (Expo SDK 51+)
- Firebase Firestore (veritabanı)
- Firebase Cloud Functions (arka plan işlemleri)
- Zustand (state yönetimi)
- React Query / TanStack Query (veri çekme)
- React Native Reanimated 3 (animasyon)
- TypeScript (zorunlu, tüm dosyalar .tsx veya .ts)

Mevcut renk sistemi:
- saffron:    #F4A418  (primary)
- terracotta: #C0513A  (accent)
- cream:      #FAF3E0  (light bg)
- charcoal:   #1C1C1E  (dark bg)
- glassLight: rgba(255,253,247,0.72)
- glassDark:  rgba(28,28,30,0.72)
- glassBorder:rgba(244,164,24,0.25)

Mevcut font sistemi:
- displayFont: 'PlayfairDisplay-Bold'
- bodyFont:    'DMSans-Regular'
- accentFont:  'Fraunces-Regular'
```

---

## 🎯 Modülün Amacı

Keşfet ekranında bir **"Modlar"** bölümü oluştur. Kullanıcı ruh haline veya ortama uygun
bir mod seçer (örn: "Maç Gecesi", "Pazar Keyfi"). Sistem bu moda göre skorlanmış
içerikleri Firestore'dan çekip gösterir. Spotify'ın mood playlist sistemiyle aynı mantık.

---

## 📂 Oluşturulacak Dosyalar

```
src/
  types/
    mood.types.ts                         ← Tüm tip tanımları
  constants/
    moodModes.ts                          ← Mod kataloğu (sabit veri)
  hooks/
    useMoodFeed.ts                        ← Mod bazlı içerik çekme
    useDynamicMoodSuggestion.ts           ← Otomatik mod önerisi
    useMoodLogger.ts                      ← Mod kullanım kaydı
  components/
    mood/
      MoodModesSection.tsx                ← Ana bölüm bileşeni
      MoodModeCard.tsx                    ← Tekil mod kartı
      MoodFeedList.tsx                    ← Mod içerik listesi
      DynamicMoodBanner.tsx               ← Otomatik öneri banner'ı
  screens/
    explore/
      ExploreScreen.tsx                   ← Mevcut dosyaya entegre et
  utils/
    moodScoreCalculator.ts                ← Skor hesaplama yardımcısı
  config/
    firebase.ts                           ← Mevcut Firebase config
```

---

## ADIM 1 — Tip Tanımları

**Dosya:** `src/types/mood.types.ts`

```typescript
// Tüm mood sistemi tip tanımları

export type MoodOrtam =
  | 'mac_gecesi'
  | 'pazar_keyfi'
  | 'romantik_aksam'
  | 'arkadas_bulusmasi'
  | 'yalniz_gece'
  | 'aile_sofrasi'
  | 'bayram_sofrasi'
  | 'ofis_ogle';

export type MoodZaman =
  | 'sabah'
  | 'ogle'
  | 'aksam'
  | 'gece'
  | 'hafta_sonu'
  | 'ozel_gun';

export type MoodEnerji =
  | 'kolay_hazirlanir'
  | 'gosteris_ister'
  | 'hizli'
  | 'uzun_pisirme'
  | 'hazir';

export type MoodDuygu =
  | 'konfor'
  | 'heyecan'
  | 'nostalji'
  | 'saglikli'
  | 'semarlik';

export type MoodVector = {
  ortam: MoodOrtam[];
  zaman: MoodZaman[];
  enerji: MoodEnerji[];
  duygu: MoodDuygu[];
  keywords: string[];
  weights: {
    keyword: number;   // 0.40
    ortam: number;     // 0.25
    zaman: number;     // 0.15
    enerji: number;    // 0.10
    duygu: number;     // 0.10
  };
};

export type MoodMode = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  gradient: [string, string];   // Kart gradyan renkleri
  vector: MoodVector;
  dynamicTrigger?: DynamicTrigger;
};

export type DynamicTrigger = {
  hours?: number[];       // Hangi saatlerde öner (0-23)
  days?: number[];        // Hangi günlerde öner (0=Pazar, 6=Cumartesi)
  isHoliday?: boolean;    // Özel günde öner
};

// Firestore post dökümanına eklenecek mood alanları
export type PostMoodTags = {
  ortam: MoodOrtam[];
  zaman: MoodZaman[];
  enerji: MoodEnerji[];
  duygu: MoodDuygu[];
  moodScores: Record<string, number>;   // { mac_gecesi: 0.92, pazar_keyfi: 0.15, ... }
  isTagged: boolean;                    // Cloud Function tamamladı mı?
};

// Kullanıcının mod seçim geçmişi (kişiselleştirme için)
export type MoodLog = {
  moodId: string;
  selectedAt: string;
  dayOfWeek: number;
  hour: number;
};
```

---

## ADIM 2 — Mod Kataloğu

**Dosya:** `src/constants/moodModes.ts`

```typescript
import { MoodMode } from '../types/mood.types';

export const MOOD_MODES: MoodMode[] = [
  {
    id: 'mac_gecesi',
    name: 'Maç Gecesi',
    emoji: '⚽',
    description: 'Eller bulaşmadan, paylaşımlık atıştırmalıklar',
    gradient: ['#C0513A', '#8B2500'],
    vector: {
      ortam: ['mac_gecesi', 'arkadas_bulusmasi'],
      zaman: ['aksam', 'gece'],
      enerji: ['kolay_hazirlanir', 'hizli'],
      duygu: ['heyecan', 'semarlik'],
      keywords: [
        'cips', 'nachos', 'söğüş', 'finger food', 'atıştırmalık',
        'kanat', 'nugget', 'dip sos', 'meze', 'çerez',
      ],
      weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
    },
    dynamicTrigger: {
      hours: [18, 19, 20, 21, 22],
      days: [5, 6],  // Cuma, Cumartesi
    },
  },
  {
    id: 'pazar_keyfi',
    name: 'Pazar Keyfi',
    emoji: '☀️',
    description: 'Mangal, sofra hazırlığı, bolca vakit',
    gradient: ['#F4A418', '#C0513A'],
    vector: {
      ortam: ['pazar_keyfi', 'aile_sofrasi', 'arkadas_bulusmasi'],
      zaman: ['ogle', 'hafta_sonu'],
      enerji: ['uzun_pisirme', 'gosteris_ister'],
      duygu: ['konfor', 'nostalji'],
      keywords: [
        'mangal', 'et', 'köfte', 'izgara', 'barbekü',
        'pide', 'salata', 'cacık', 'mevsim', 'kebap',
      ],
      weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
    },
    dynamicTrigger: {
      hours: [10, 11, 12, 13, 14],
      days: [0],  // Pazar
    },
  },
  {
    id: 'romantik_aksam',
    name: 'Romantik Akşam',
    emoji: '🕯️',
    description: 'İkili sofra, özenli sunum, şık tarifler',
    gradient: ['#8B2563', '#C0513A'],
    vector: {
      ortam: ['romantik_aksam'],
      zaman: ['aksam'],
      enerji: ['gosteris_ister'],
      duygu: ['semarlik', 'heyecan'],
      keywords: [
        'pasta', 'risotto', 'çikolata', 'sufle', 'şarap',
        'salmon', 'karidesli', 'krem sos', 'candle light', 'tatlı',
      ],
      weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
    },
    dynamicTrigger: {
      hours: [19, 20, 21],
      isHoliday: true,
    },
  },
  {
    id: 'konfor_gecesi',
    name: 'Konfor Gecesi',
    emoji: '🛋️',
    description: 'Battaniyeye sarılıp yenecek sıcak tarifler',
    gradient: ['#2C3E50', '#3B4A2F'],
    vector: {
      ortam: ['yalniz_gece'],
      zaman: ['gece'],
      enerji: ['kolay_hazirlanir'],
      duygu: ['konfor', 'nostalji'],
      keywords: [
        'çorba', 'makarna', 'pilav', 'sıcak', 'kase',
        'mercimek', 'tarhana', 'erişte', 'peynirli', 'ekmek',
      ],
      weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
    },
    dynamicTrigger: {
      hours: [21, 22, 23],
    },
  },
  {
    id: 'sabahin_enerjisi',
    name: 'Sabahın Enerjisi',
    emoji: '⚡',
    description: 'Güne hızlı ve sağlıklı başlamak için',
    gradient: ['#F4A418', '#8FA67A'],
    vector: {
      ortam: ['ofis_ogle'],
      zaman: ['sabah'],
      enerji: ['hizli', 'kolay_hazirlanir'],
      duygu: ['saglikli'],
      keywords: [
        'smoothie', 'yulaf', 'granola', 'avokado', 'kahvaltı',
        'enerji', 'protein', 'meyve', 'acai', 'chia',
      ],
      weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
    },
    dynamicTrigger: {
      hours: [6, 7, 8, 9],
    },
  },
  {
    id: 'misafir_sofrasi',
    name: 'Misafir Sofrası',
    emoji: '👥',
    description: 'İzlenim bırakacak, bol porsiyonlu tarifler',
    gradient: ['#C0513A', '#F4A418'],
    vector: {
      ortam: ['arkadas_bulusmasi', 'aile_sofrasi'],
      zaman: ['ogle', 'aksam'],
      enerji: ['gosteris_ister', 'uzun_pisirme'],
      duygu: ['heyecan', 'nostalji'],
      keywords: [
        'dolma', 'börek', 'baklava', 'sarmak', 'hazırlamak',
        'büyük porsiyon', 'sofra', 'sunum', 'tatlı', 'meze tabağı',
      ],
      weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
    },
  },
  {
    id: 'saglikli_yasam',
    name: 'Sağlıklı Yaşam',
    emoji: '🥗',
    description: 'Hafif, besleyici, dengeli tarifler',
    gradient: ['#3B4A2F', '#8FA67A'],
    vector: {
      ortam: ['yalniz_gece', 'ofis_ogle'],
      zaman: ['sabah', 'ogle'],
      enerji: ['kolay_hazirlanir', 'hizli'],
      duygu: ['saglikli'],
      keywords: [
        'salata', 'detoks', 'light', 'düşük kalori', 'vegan',
        'glutensiz', 'sebze', 'kinoa', 'taze', 'diyet',
      ],
      weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
    },
  },
  {
    id: 'bayram_sofrasi',
    name: 'Bayram Sofrası',
    emoji: '🎉',
    description: 'Geleneksel tatlar, bayramın olmazsa olmazları',
    gradient: ['#F4A418', '#C0513A'],
    vector: {
      ortam: ['bayram_sofrasi', 'aile_sofrasi'],
      zaman: ['ogle', 'aksam', 'ozel_gun'],
      enerji: ['uzun_pisirme', 'gosteris_ister'],
      duygu: ['nostalji', 'konfor'],
      keywords: [
        'baklava', 'helva', 'sarma', 'lokum', 'börek',
        'geleneksel', 'bayramlık', 'kurabiye', 'şerbet', 'sütlaç',
      ],
      weights: { keyword: 0.40, ortam: 0.25, zaman: 0.15, enerji: 0.10, duygu: 0.10 },
    },
    dynamicTrigger: {
      isHoliday: true,
    },
  },
];

// ID ile mod bul
export const getMoodById = (id: string): MoodMode | undefined =>
  MOOD_MODES.find(m => m.id === id);
```

---

## ADIM 3 — Skor Hesaplama Yardımcısı

**Dosya:** `src/utils/moodScoreCalculator.ts`

```typescript
import { MoodMode, PostMoodTags } from '../types/mood.types';
import { MOOD_MODES } from '../constants/moodModes';

/**
 * Bir post için tüm modların skorunu hesaplar.
 * Bu fonksiyon Cloud Function'da çağrılır (post oluşturulunca).
 * Sonuçlar post.moodTags.moodScores alanına yazılır.
 */
export const calculateMoodScores = (
  caption: string,
  tags: string[],
  ingredients: string[],
  moodTags: Partial<PostMoodTags>
): Record<string, number> => {

  const scores: Record<string, number> = {};
  const fullText = [caption, ...tags, ...ingredients]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-zğüşöçıA-ZĞÜŞÖÇİ0-9 ]/g, '');

  for (const mode of MOOD_MODES) {
    const w = mode.vector.weights;

    // 1. Keyword skoru (0-1)
    const keywordMatches = mode.vector.keywords.filter(kw =>
      fullText.includes(kw.toLowerCase())
    ).length;
    const keywordScore = Math.min(keywordMatches / Math.max(mode.vector.keywords.length * 0.3, 1), 1);

    // 2. Ortam skoru (0-1)
    const ortamMatches = (moodTags.ortam ?? []).filter(o =>
      mode.vector.ortam.includes(o)
    ).length;
    const ortamScore = ortamMatches > 0 ? Math.min(ortamMatches / mode.vector.ortam.length, 1) : 0;

    // 3. Zaman skoru (0-1)
    const zamanMatches = (moodTags.zaman ?? []).filter(z =>
      mode.vector.zaman.includes(z)
    ).length;
    const zamanScore = zamanMatches > 0 ? Math.min(zamanMatches / mode.vector.zaman.length, 1) : 0;

    // 4. Enerji skoru (0-1)
    constenerjiMatches = (moodTags.enerji ?? []).filter(e =>
      mode.vector.enerji.includes(e)
    ).length;
    const energiScore = energiMatches > 0 ? Math.min(energiMatches / mode.vector.enerji.length, 1) : 0;

    // 5. Duygu skoru (0-1)
    const duyguMatches = (moodTags.duygu ?? []).filter(d =>
      mode.vector.duygu.includes(d)
    ).length;
    const duyguScore = duyguMatches > 0 ? Math.min(duyguMatches / mode.vector.duygu.length, 1) : 0;

    // Ağırlıklı toplam
    scores[mode.id] = parseFloat((
      keywordScore  * w.keyword +
      ortamScore    * w.ortam   +
      zamanScore    * w.zaman   +
      energiScore   * w.enerji  +
      duyguScore    * w.duygu
    ).toFixed(3));
  }

  return scores;
};

/**
 * Belirli bir saat ve güne göre hangi modun öne çıkacağını belirler.
 * ExploreScreen'de banner olarak gösterilir.
 */
export const getSuggestedMood = (hour: number, dayOfWeek: number): MoodMode | null => {
  const candidates = MOOD_MODES.filter(mode => {
    const t = mode.dynamicTrigger;
    if (!t) return false;
    const hourMatch = !t.hours || t.hours.includes(hour);
    const dayMatch  = !t.days  || t.days.includes(dayOfWeek);
    return hourMatch && dayMatch;
  });

  if (candidates.length === 0) return null;
  // Birden fazla eşleşirse öncelik sırasına göre ilkini döndür
  return candidates[0];
};
```

---

## ADIM 4 — Firebase Cloud Function (Post Oluşturulunca Skor Hesapla)

**Dosya:** `functions/src/processMoodTags.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { calculateMoodScores } from '../../src/utils/moodScoreCalculator';

/**
 * Yeni post oluşturulduğunda mood skorlarını hesapla ve post'a yaz.
 * Bu işlem arka planda çalışır, UI'ı bloklamaz.
 */
export const processMoodTags = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    const db = admin.firestore();

    // Zaten işlendiyse atla
    if (post.moodTags?.isTagged) return;

    try {
      const moodScores = calculateMoodScores(
        post.caption ?? '',
        post.tags ?? [],
        post.ingredients ?? [],
        post.moodTags ?? {}
      );

      await snap.ref.update({
        'moodTags.moodScores': moodScores,
        'moodTags.isTagged': true,
      });

    } catch (error) {
      functions.logger.error('Mood tag processing failed:', error);
      await snap.ref.update({ 'moodTags.isTagged': false });
    }
  });

/**
 * Mevcut post'ları toplu olarak işlemek için HTTP trigger.
 * Sadece bir kez çalıştır — eski postları retroaktif etiketler.
 * Çağrı: POST https://.../processMoodTagsBatch
 */
export const processMoodTagsBatch = functions.https.onRequest(async (req, res) => {
  // Admin authentication kontrolü
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    res.status(403).send('Unauthorized');
    return;
  }

  const db = admin.firestore();
  const batchSize = 100;
  let processed = 0;

  const untaggedPosts = await db.collection('posts')
    .where('moodTags.isTagged', '==', false)
    .limit(batchSize)
    .get();

  const batch = db.batch();

  for (const doc of untaggedPosts.docs) {
    const post = doc.data();
    const moodScores = calculateMoodScores(
      post.caption ?? '',
      post.tags ?? [],
      post.ingredients ?? [],
      post.moodTags ?? {}
    );

    batch.update(doc.ref, {
      'moodTags.moodScores': moodScores,
      'moodTags.isTagged': true,
    });
    processed++;
  }

  await batch.commit();
  res.json({ processed, remaining: untaggedPosts.size - processed });
});
```

---

## ADIM 5 — React Native Hook'ları

**Dosya:** `src/hooks/useMoodFeed.ts`

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  collection, query, where, orderBy, limit,
  startAfter, getDocs, DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { usePalateProfile } from './usePalateProfile'; // Mevcut hook

/**
 * Seçilen moda göre Firestore'dan içerik çeker.
 * AI Damak Profili ile kişiselleştirme katmanı ekler.
 * Sonsuz scroll (infinite query) desteği var.
 */
export const useMoodFeed = (moodId: string | null) => {
  const { profile } = usePalateProfile();

  return useInfiniteQuery({
    queryKey: ['moodFeed', moodId, profile?.palatePersona],
    enabled: !!moodId,

    queryFn: async ({ pageParam }: { pageParam?: DocumentSnapshot }) => {
      if (!moodId) return { posts: [], lastDoc: null };

      const scoreField = `moodTags.moodScores.${moodId}`;
      const MIN_SCORE = 0.35; // Bu eşiğin altındaki içerikler gösterilmez

      let q = query(
        collection(db, 'posts'),
        where('moodTags.isTagged', '==', true),
        where(scoreField, '>=', MIN_SCORE),
        orderBy(scoreField, 'desc'),
        orderBy('likeCount', 'desc'),
        limit(12)
      );

      // Sayfalama
      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }

      const snap = await getDocs(q);
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const lastDoc = snap.docs[snap.docs.length - 1] ?? null;

      // Damak profili kişiselleştirmesi
      // Kullanıcının güçlü olduğu mutfaklar öne çıkar
      const personalizedPosts = personalizePosts(posts, profile);

      return { posts: personalizedPosts, lastDoc };
    },

    getNextPageParam: (lastPage) => lastPage.lastDoc ?? undefined,
    staleTime: 3 * 60 * 1000, // 3 dakika cache
  });
};

/**
 * Damak profili bazlı sıralama — aynı mood skoru varsa
 * kullanıcının sevdiği mutfak türü öne çıkar.
 */
const personalizePosts = (posts: any[], profile: any) => {
  if (!profile) return posts;

  return [...posts].sort((a, b) => {
    const aScore = a.moodTags?.moodScores?.[a.id] ?? 0;
    const bScore = b.moodTags?.moodScores?.[b.id] ?? 0;

    // Kullanıcının güçlü olduğu mutfak bonusu
    const aBonus = getCuisineBonus(a.tags ?? [], profile);
    const bBonus = getCuisineBonus(b.tags ?? [], profile);

    return (bScore + bBonus) - (aScore + aBonus);
  });
};

const getCuisineBonus = (tags: string[], profile: any): number => {
  if (!profile?.cuisines) return 0;
  let bonus = 0;
  for (const [cuisine, score] of Object.entries(profile.cuisines)) {
    if ((score as number) > 60 && tags.some(t => t.includes(cuisine))) {
      bonus += 0.1;
    }
  }
  return Math.min(bonus, 0.3); // Maksimum 0.3 bonus
};
```

---

**Dosya:** `src/hooks/useDynamicMoodSuggestion.ts`

```typescript
import { useMemo } from 'react';
import { getSuggestedMood } from '../utils/moodScoreCalculator';
import { MoodMode } from '../types/mood.types';

/**
 * Şu anki saat ve güne göre otomatik mod önerisi yapar.
 * ExploreScreen'de DynamicMoodBanner için kullanılır.
 */
export const useDynamicMoodSuggestion = (): MoodMode | null => {
  return useMemo(() => {
    const now = new Date();
    return getSuggestedMood(now.getHours(), now.getDay());
  }, [
    // Saate göre memoize et — her saat başı güncellenir
    Math.floor(Date.now() / (60 * 60 * 1000)),
  ]);
};
```

---

**Dosya:** `src/hooks/useMoodLogger.ts`

```typescript
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../store/authStore';

/**
 * Kullanıcının seçtiği modları loglar.
 * Gelecekte kişiselleştirilmiş mod önerileri için kullanılır.
 */
export const useMoodLogger = () => {
  const { user } = useAuthStore();

  const logMoodSelection = async (moodId: string) => {
    if (!user) return;
    const now = new Date();

    // Ateş and forget — await etme, UI'ı bloklama
    addDoc(collection(db, 'users', user.uid, 'moodLogs'), {
      moodId,
      selectedAt: now.toISOString(),
      dayOfWeek: now.getDay(),
      hour: now.getHours(),
    }).catch(() => {}); // Hata olursa sessizce geç
  };

  return { logMoodSelection };
};
```

---

## ADIM 6 — UI Bileşenleri

**Dosya:** `src/components/mood/MoodModeCard.tsx`

```tsx
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MoodMode } from '../../types/mood.types';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  mode: MoodMode;
  isSelected: boolean;
  onPress: () => void;
};

export default function MoodModeCard({ mode, isSelected, onPress }: Props) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    // Press animasyonu
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    glowOpacity.value = withTiming(1, { duration: 150 }, () => {
      glowOpacity.value = withTiming(0, { duration: 300 });
    });
    onPress();
  };

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      {/* Seçili glow efekti */}
      {isSelected && (
        <Animated.View style={[styles.selectedGlow, glowStyle, {
          shadowColor: mode.gradient[0],
        }]} />
      )}

      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <LinearGradient
          colors={isSelected
            ? mode.gradient
            : [theme.surface, theme.surface]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            {
              borderColor: isSelected
                ? mode.gradient[0]
                : theme.border,
              borderWidth: isSelected ? 1.5 : 1,
            }
          ]}
        >
          {/* Emoji */}
          <Text style={styles.emoji}>{mode.emoji}</Text>

          {/* İsim */}
          <Text style={[
            styles.name,
            { color: isSelected ? '#FAF3E0' : theme.text }
          ]}>
            {mode.name}
          </Text>

          {/* Açıklama */}
          <Text style={[
            styles.description,
            { color: isSelected ? 'rgba(250,243,224,0.7)' : theme.textSecondary }
          ]}
            numberOfLines={2}
          >
            {mode.description}
          </Text>

          {/* Seçili indicator */}
          {isSelected && (
            <View style={styles.selectedDot} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 140,
    marginRight: 12,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    minHeight: 130,
    overflow: 'hidden',
  },
  selectedGlow: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  name: {
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  selectedDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FAF3E0',
  },
});
```

---

**Dosya:** `src/components/mood/DynamicMoodBanner.tsx`

```tsx
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { MoodMode } from '../../types/mood.types';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  mode: MoodMode;
  onPress: () => void;
};

export default function DynamicMoodBanner({ mode, onPress }: Props) {
  const { theme } = useTheme();
  const pulseAnim = useSharedValue(1);

  // Hafif pulse animasyonu — dikkat çeker
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1.00, { duration: 1500 })
      ),
      -1, // sonsuz
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, pulseStyle]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={mode.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        >
          {/* Sol: ikon + metin */}
          <View style={styles.left}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>ŞU AN</Text>
            </View>
            <Text style={styles.title}>
              {mode.emoji} {mode.name} Modu
            </Text>
            <Text style={styles.subtitle}>
              {mode.description}
            </Text>
          </View>

          {/* Sağ: ok */}
          <Text style={styles.arrow}>→</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#F4A418',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  left: {
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FAF3E0',
    marginRight: 5,
  },
  liveText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 10,
    color: 'rgba(250,243,224,0.7)',
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FAF3E0',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: 'rgba(250,243,224,0.75)',
  },
  arrow: {
    fontSize: 24,
    color: '#FAF3E0',
    marginLeft: 12,
  },
});
```

---

**Dosya:** `src/components/mood/MoodModesSection.tsx`

```tsx
import { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useDynamicMoodSuggestion } from '../../hooks/useDynamicMoodSuggestion';
import { useMoodLogger } from '../../hooks/useMoodLogger';
import { MOOD_MODES } from '../../constants/moodModes';
import MoodModeCard from './MoodModeCard';
import MoodFeedList from './MoodFeedList';
import DynamicMoodBanner from './DynamicMoodBanner';
import { useTheme } from '../../theme/ThemeProvider';

export default function MoodModesSection() {
  const { theme } = useTheme();
  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);
  const suggestedMood = useDynamicMoodSuggestion();
  const { logMoodSelection } = useMoodLogger();

  const handleMoodSelect = (moodId: string) => {
    // Aynı moda tekrar basılırsa seçimi kaldır
    const newSelection = selectedMoodId === moodId ? null : moodId;
    setSelectedMoodId(newSelection);
    if (newSelection) logMoodSelection(newSelection);
  };

  return (
    <View style={styles.container}>

      {/* Bölüm Başlığı */}
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          🎭 Ruh Haline Göre
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
          Anına uygun tarifleri keşfet
        </Text>
      </View>

      {/* Otomatik Mod Önerisi Banner */}
      {suggestedMood && !selectedMoodId && (
        <DynamicMoodBanner
          mode={suggestedMood}
          onPress={() => handleMoodSelect(suggestedMood.id)}
        />
      )}

      {/* Mod Kartları — Yatay Scroll */}
      <FlatList
        data={MOOD_MODES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MoodModeCard
            mode={item}
            isSelected={selectedMoodId === item.id}
            onPress={() => handleMoodSelect(item.id)}
          />
        )}
      />

      {/* Seçili Mod İçerik Listesi */}
      {selectedMoodId && (
        <MoodFeedList moodId={selectedMoodId} />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
  },
  moodList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});
```

---

**Dosya:** `src/components/mood/MoodFeedList.tsx`

```tsx
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useMoodFeed } from '../../hooks/useMoodFeed';
import { getMoodById } from '../../constants/moodModes';
import PostCard from '../feed/PostCard'; // Mevcut PostCard bileşeni
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  moodId: string;
};

export default function MoodFeedList({ moodId }: Props) {
  const { theme } = useTheme();
  const mode = getMoodById(moodId);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useMoodFeed(moodId);

  const allPosts = data?.pages.flatMap(p => p.posts) ?? [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#F4A418" size="large" />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {mode?.emoji} {mode?.name} tarifleri getiriliyor...
        </Text>
      </View>
    );
  }

  if (allPosts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🍽️</Text>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          Henüz içerik yok
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Bu mod için ilk tarifi sen paylaş!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mod başlığı */}
      <View style={styles.feedHeader}>
        <Text style={[styles.feedTitle, { color: theme.text }]}>
          {mode?.emoji} {mode?.name} için {allPosts.length}+ tarif
        </Text>
      </View>

      {/* Post listesi */}
      <FlatList
        data={allPosts}
        scrollEnabled={false} // Ana scroll'u kullan
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator color="#F4A418" style={{ marginVertical: 16 }} />
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  container: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  feedHeader: {
    marginBottom: 12,
  },
  feedTitle: {
    fontFamily: 'DMSans-Medium',
    fontSize: 15,
    fontWeight: '600',
  },
});
```

---

## ADIM 7 — ExploreScreen Entegrasyonu

**Dosya:** `src/screens/explore/ExploreScreen.tsx`

```tsx
// Mevcut ExploreScreen'e MoodModesSection bileşenini ekle.
// Arama çubuğunun hemen altına, diğer içerik bölümlerinin üstüne yerleştir.

import MoodModesSection from '../../components/mood/MoodModesSection';

// ExploreScreen render içinde:
export default function ExploreScreen() {
  return (
    <ScrollView>
      {/* Mevcut: Arama çubuğu */}
      <SearchBar />

      {/* YENİ: Ruh Hali Modları */}
      <MoodModesSection />

      {/* Mevcut: Trending tag'ler */}
      <TrendingTags />

      {/* Mevcut: Masonry grid */}
      <ExploreGrid />
    </ScrollView>
  );
}
```

---

## ADIM 8 — Firestore Güvenlik Kuralları & İndeksler

### Güvenlik Kuralları — `firestore.rules`

```javascript
// Mood logları — sadece kendi yazabilir, okuyabilir
match /users/{userId}/moodLogs/{logId} {
  allow read, write: if request.auth.uid == userId;
}

// Post mood skorları — herkes okuyabilir, sadece Cloud Function yazar
match /posts/{postId} {
  allow read: if request.auth != null;
  allow update: if request.auth != null &&
    // Kullanıcı sadece kendi alanlarını güncelleyebilir
    !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['moodTags.moodScores', 'moodTags.isTagged']);
}
```

### Bileşik İndeksler — `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "moodTags.isTagged",              "order": "ASCENDING" },
        { "fieldPath": "moodTags.moodScores.mac_gecesi", "order": "DESCENDING" },
        { "fieldPath": "likeCount",                      "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "moodTags.isTagged",               "order": "ASCENDING" },
        { "fieldPath": "moodTags.moodScores.pazar_keyfi", "order": "DESCENDING" },
        { "fieldPath": "likeCount",                       "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "moodTags.isTagged",                    "order": "ASCENDING" },
        { "fieldPath": "moodTags.moodScores.romantik_aksam",   "order": "DESCENDING" },
        { "fieldPath": "likeCount",                            "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "moodTags.isTagged",                  "order": "ASCENDING" },
        { "fieldPath": "moodTags.moodScores.konfor_gecesi",  "order": "DESCENDING" },
        { "fieldPath": "likeCount",                          "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "moodTags.isTagged",                     "order": "ASCENDING" },
        { "fieldPath": "moodTags.moodScores.sabahin_enerjisi",  "order": "DESCENDING" },
        { "fieldPath": "likeCount",                             "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "moodTags.isTagged",                   "order": "ASCENDING" },
        { "fieldPath": "moodTags.moodScores.misafir_sofrasi", "order": "DESCENDING" },
        { "fieldPath": "likeCount",                           "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "moodTags.isTagged",                  "order": "ASCENDING" },
        { "fieldPath": "moodTags.moodScores.saglikli_yasam", "order": "DESCENDING" },
        { "fieldPath": "likeCount",                          "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "moodTags.isTagged",                  "order": "ASCENDING" },
        { "fieldPath": "moodTags.moodScores.bayram_sofrasi", "order": "DESCENDING" },
        { "fieldPath": "likeCount",                          "order": "DESCENDING" }
      ]
    }
  ]
}
```

> **Önemli:** Her mod için ayrı bileşik index gerekir.
> `firebase deploy --only firestore:indexes` komutuyla deploy et.

---

## ADIM 9 — Gönderi Oluşturma Entegrasyonu

Kullanıcı gönderi oluştururken mood etiketlerini seçebilmeli.
**Mevcut CreatePostScreen'e şu alanları ekle:**

```tsx
// CreatePostScreen — Step 3 (Detaylar) içine ekle

import { MOOD_MODES } from '../../constants/moodModes';

// State
const [selectedOrtam, setSelectedOrtam] = useState<MoodOrtam[]>([]);
const [selectedZaman, setSelectedZaman]  = useState<MoodZaman[]>([]);

// UI — "Bu tarif hangi ortama uyar?" sorusu
<View style={styles.moodSection}>
  <Text style={styles.moodLabel}>Bu tarif hangi ortama uyar?</Text>
  <Text style={styles.moodHint}>Seçimleriniz içeriğinizin doğru kişilere ulaşmasını sağlar</Text>

  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {MOOD_MODES.map(mode => (
      <TouchableOpacity
        key={mode.id}
        onPress={() => toggleOrtamSelection(mode.id)}
        style={[
          styles.moodChip,
          selectedOrtam.includes(mode.id as MoodOrtam) && styles.moodChipSelected
        ]}
      >
        <Text style={styles.moodChipText}>{mode.emoji} {mode.name}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>

// Post oluştururken moodTags alanını ekle:
await addDoc(collection(db, 'posts'), {
  // ... diğer alanlar
  moodTags: {
    ortam: selectedOrtam,
    zaman: selectedZaman,
    enerji: [],
    duygu: [],
    moodScores: {},   // Cloud Function dolduracak
    isTagged: false,  // Cloud Function true yapacak
  },
});
```

---

## ADIM 10 — XP Entegrasyonu

```typescript
// Mevcut XP sistemine şu aksiyonları ekle:
const MOOD_XP = {
  mood_post_tagged:     5,   // Gönderi oluştururken mod etiketi seçti
  mood_recipe_cooked:  20,   // Mod önerisiyle tarif yaptı ve paylaştı
};

// useMoodFeed içinde — kullanıcı mod içeriğinden tarif yapıp paylaşırsa:
// Paylaşım sonrası XP trigger et
```

---

## ✅ Implementasyon Kontrol Listesi

Bu listeyi sırayla tamamla. Her adımı tamamlayınca işaretle.

- [ ] `src/types/mood.types.ts` oluştur
- [ ] `src/constants/moodModes.ts` oluştur
- [ ] `src/utils/moodScoreCalculator.ts` oluştur
- [ ] `functions/src/processMoodTags.ts` Cloud Function oluştur
- [ ] Cloud Function'ı deploy et: `firebase deploy --only functions`
- [ ] `src/hooks/useMoodFeed.ts` oluştur
- [ ] `src/hooks/useDynamicMoodSuggestion.ts` oluştur
- [ ] `src/hooks/useMoodLogger.ts` oluştur
- [ ] `src/components/mood/MoodModeCard.tsx` oluştur
- [ ] `src/components/mood/DynamicMoodBanner.tsx` oluştur
- [ ] `src/components/mood/MoodModesSection.tsx` oluştur
- [ ] `src/components/mood/MoodFeedList.tsx` oluştur
- [ ] `ExploreScreen.tsx` içine `<MoodModesSection />` ekle
- [ ] `firestore.indexes.json` güncelle, deploy et
- [ ] `firestore.rules` güncelle, deploy et
- [ ] `CreatePostScreen.tsx` mood tag seçim alanı ekle
- [ ] XP tablosuna mood aksiyonlarını ekle
- [ ] Mevcut postları retroaktif etiketlemek için batch function çalıştır

---

## ⚠️ Dikkat Edilecek Noktalar

1. **Her mod için ayrı Firestore index** zorunlu — index olmadan sorgu hata verir.
2. `moodScores` alanı sorgu anında değil **post oluşturulurken** hesaplanır — performans için kritik.
3. `useMoodFeed` hook'unda `enabled: !!moodId` kontrolü var — mod seçilmeden sorgu gitmesin.
4. `DynamicMoodBanner` sadece mod seçili değilken gösterilir (`!selectedMoodId`).
5. `logMoodSelection` fire-and-forget çalışır, `await` etme.
6. Batch function (`processMoodTagsBatch`) sadece bir kez çalıştır, sonra sil.

---

*Döküman versiyonu: 1.0 | Neyesem Uygulaması | Ruh Hali Modu Modülü*
