# 🧠 Vizyoner Modüller — Teknik Spesifikasyon v1.0
## AI Damak Profili · Haftalık Lezzet Görevi · Tarif Zinciri

> **Temel Felsefe:** Bu üç modül birbirini besleyen bir etkileşim döngüsü oluşturur.
> AI profil davranışı öğrenir → Kişiselleştirilmiş görev önerir → Tarif zinciri viral yayılır →
> Yeni etkileşimler profili günceller → Döngü güçlenir.

---

# BÖLÜM 1 — 🧠 AI Damak Profili

## 1.1 Konsept & Etkileşim Hedefi

Kullanıcının platformdaki her hareketini sessizce izleyen, zamanla onun lezzet kimliğini çıkaran
bir AI katmanı. Amaç yalnızca öneri sunmak değil — kullanıcıya **"bu platform beni tanıyor"**
hissini yaşatmak ve bu his üzerinden derin bir bağ kurmak.

Etkileşim tetikleyicileri:
- Keşfet sayfası tamamen kişiselleşir → daha uzun kalma süresi
- "Damak Karterim" profil bölümü → sosyal kimlik, paylaşılabilir içerik
- Haftalık lezzet görevi bu profil üzerinden atanır → kişisel hissettiren görev = daha yüksek tamamlama oranı
- "Sen şunu seviyorsun, şunu dene" kartları → tıklanma dürtüsü

---

## 1.2 Veri Toplama — Ne İzlenir?

```typescript
type UserSignal = {
  // Aktif sinyaller (kullanıcı bilinçli yapıyor)
  liked_post_id: string;        // Beğenilen gönderi
  saved_post_id: string;        // Kaydedilen tarif
  commented_post_id: string;    // Yorum yapılan gönderi
  shared_post_id: string;       // Paylaşılan içerik
  completed_recipe_id: string;  // Tamamlanan tarif zinciri adımı

  // Pasif sinyaller (kullanıcı farkında değil)
  view_duration_ms: number;     // İçerikte geçirilen süre
  scroll_depth: number;         // Kaydırma derinliği (0-100)
  replay_count: number;         // Video tekrar izleme sayısı
  profile_visit: string;        // Ziyaret edilen profil

  // Bağlam sinyalleri
  time_of_day: string;          // Sabah/öğle/akşam/gece
  day_of_week: string;          // Hafta içi/sonu
};
```

---

## 1.3 Damak Profili Veri Modeli

```typescript
type PalateProfile = {
  userId: string;

  // Mutfak tercihleri (0-100 arası skor)
  cuisines: {
    turkish: number;
    asian: number;
    italian: number;
    mediterranean: number;
    streetFood: number;
    homeCooking: number;
    fineDining: number;
    vegan: number;
  };

  // Lezzet profili
  flavorProfile: {
    spicy: number;
    sweet: number;
    savory: number;
    sour: number;
    rich: number;
    light: number;
  };

  // İçerik tercihleri
  contentPreferences: {
    quickRecipes: number;     // Hızlı tarifler (< 30 dk)
    elaborateRecipes: number;
    videoContent: number;
    embedContent: number;
    originalPosts: number;
  };

  // Öğün zamanları
  mealPatterns: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    lateNight: boolean;
    snack: boolean;
  };

  // Meta
  dominantTaste: string;
  palatePersona: string;
  lastUpdated: string;
  signalCount: number;
};
```

---

## 1.4 AI Persona Sistemi

Profil 50+ sinyal topladıktan sonra kullanıcıya bir **Damak Personası** atanır.
Profil sayfasında gösterilir ve paylaşılabilir.

```typescript
const PALATE_PERSONAS = [
  {
    id: 'adventurous_explorer',
    name: '🌍 Maceracı Kaşif',
    description: 'Her mutfaktan bir şeyler dener, alışılmışın dışına çıkar',
    triggerCondition: (p: PalateProfile) =>
      Object.values(p.cuisines).filter(v => v > 40).length >= 5,
  },
  {
    id: 'spice_hunter',
    name: '🌶️ Acı Avcısı',
    description: 'Ne kadar acı olursa o kadar iyi',
    triggerCondition: (p: PalateProfile) => p.flavorProfile.spicy > 75,
  },
  {
    id: 'comfort_cook',
    name: '🏠 Konfor Aşçısı',
    description: 'Ev yemeklerinin sıcaklığını ve otantikliğini sever',
    triggerCondition: (p: PalateProfile) =>
      p.cuisines.homeCooking > 70 && p.flavorProfile.rich > 60,
  },
  {
    id: 'street_soul',
    name: '🛵 Sokak Ruhu',
    description: 'En iyi yemekler kaldırım kenarında bulunur',
    triggerCondition: (p: PalateProfile) => p.cuisines.streetFood > 70,
  },
  {
    id: 'zen_eater',
    name: '🍃 Sade & Sağlıklı',
    description: 'Temiz malzeme, saf lezzet',
    triggerCondition: (p: PalateProfile) =>
      p.flavorProfile.light > 70 && p.cuisines.vegan > 50,
  },
  {
    id: 'gourmet_soul',
    name: '⚜️ Gurme Ruhu',
    description: 'Detaylara takılır, lezzetin arkasındaki hikayeyi arar',
    triggerCondition: (p: PalateProfile) => p.cuisines.fineDining > 65,
  },
];
```

---

## 1.5 Firebase Veri Yapısı

```
Firestore Collections:

/users/{userId}/palateProfile          ← Ana profil dökümanı
/users/{userId}/signals/{signalId}     ← Ham sinyal kayıtları
/users/{userId}/palateHistory/{date}   ← Haftalık snapshot (trend takibi)
```

```
Firebase Security Rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 1.6 Skor Güncelleme Algoritması

```typescript
// Exponential moving average — son davranışlar daha ağırlıklı
const updatePalateScore = (
  currentScore: number,
  newSignalWeight: number,
  alpha: number = 0.15  // Öğrenme hızı
): number => {
  return currentScore * (1 - alpha) + newSignalWeight * alpha;
};

const SIGNAL_WEIGHTS = {
  view_under_3s:    2,
  view_3_to_10s:    5,
  view_over_10s:    12,
  like:             15,
  save:             25,  // En güçlü sinyal
  comment:          20,
  share:            30,
  recipe_started:   35,
  recipe_completed: 50,  // En güçlü sinyal
  scroll_past:      -3,  // Negatif sinyal
};
```

---

## 1.7 React Native Hook'ları

```typescript
// Ana profil hook'u
const usePalateProfile = () => {
  const { user } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['palateProfile', user?.uid],
    queryFn: async () => {
      const snap = await getDoc(
        doc(db, 'users', user!.uid, 'palateProfile')
      );
      return snap.data() as PalateProfile;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { profile, isLoading };
};

// Sinyal gönderme hook'u
const useSendSignal = () => {
  const { user } = useAuthStore();

  const sendSignal = async (
    type: keyof typeof SIGNAL_WEIGHTS,
    postId: string,
    postTags: string[]
  ) => {
    await addDoc(
      collection(db, 'users', user!.uid, 'signals'),
      { type, postId, postTags, createdAt: serverTimestamp() }
    );
    // Cloud Function otomatik tetiklenir, UI bloklanmaz
  };

  return { sendSignal };
};

// İçerik görüntüleme süresi takibi (pasif sinyal)
const useViewTracking = (postId: string, postTags: string[]) => {
  const { sendSignal } = useSendSignal();
  const startTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      const duration = Date.now() - startTime.current;
      const type =
        duration < 3000  ? 'view_under_3s'  :
        duration < 10000 ? 'view_3_to_10s'  :
                           'view_over_10s';
      sendSignal(type, postId, postTags);
    };
  }, []);
};
```

---

## 1.8 Firebase Cloud Function — Profil Güncelleme

```typescript
// functions/src/updatePalateProfile.ts
export const onSignalCreated = functions.firestore
  .document('users/{userId}/signals/{signalId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const signal = snap.data();
    const db = admin.firestore();

    const profileRef = db.doc(`users/${userId}/palateProfile`);
    const profileSnap = await profileRef.get();
    const profile = profileSnap.data() as PalateProfile;

    const weight = SIGNAL_WEIGHTS[signal.type] ?? 0;
    const updates: Record<string, any> = {};

    // Post tag'lerine göre ilgili skorları güncelle
    for (const tag of signal.postTags) {
      if (tag in profile.cuisines) {
        updates[`cuisines.${tag}`] = updatePalateScore(
          profile.cuisines[tag], weight
        );
      }
      if (tag in profile.flavorProfile) {
        updates[`flavorProfile.${tag}`] = updatePalateScore(
          profile.flavorProfile[tag], weight
        );
      }
    }

    // Persona güncelle
    const newPersona = PALATE_PERSONAS.find(p =>
      p.triggerCondition({ ...profile, ...updates } as PalateProfile)
    );
    if (newPersona && newPersona.id !== profile.palatePersona) {
      updates.palatePersona = newPersona.id;
      // Persona değişti — bildirim gönder
      await db.collection('notifications').add({
        recipientId: userId,
        type: 'palate_persona',
        title: 'Damak Profilin Güncellendi! 🎉',
        body: `Artık sen bir ${newPersona.name}sın`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    updates.lastUpdated = new Date().toISOString();
    updates.signalCount = admin.firestore.FieldValue.increment(1);

    await profileRef.update(updates);
  });
```

---

## 1.9 DamakKarterim UI Bileşeni

```
┌─────────────────────────────────────────┐  ← Paylaşılabilir kart
│  🌍 Maceracı Kaşifsin                   │    (react-native-view-shot)
│  "Her mutfaktan bir şeyler dener"        │
│                                         │
│  Lezzet Haritam:                        │
│  🌶️ Acılı     ████████░░  78%          │
│  🍜 Asya      ███████░░░  68%          │
│  🏠 Ev Yemeği █████░░░░░  52%          │
│  🛵 Sokak     ████░░░░░░  44%          │
│                                         │
│  [Kartımı Paylaş] ← Story olarak paylaş │
└─────────────────────────────────────────┘
```

Paylaşılan kart uygulama logosu + deep link içerir → viral döngü tetiklenir.

---
---

# BÖLÜM 2 — 🎯 Haftalık Lezzet Görevi

## 2.1 Konsept & Etkileşim Hedefi

Her Pazartesi sabahı platforma yeni bir görev düşer. Arka planda **AI Damak Profili** ile
kişiselleştirilmiştir — herkes aynı görevi görüyor sanır ama görev ona özel seçilmiştir.
Görev tamamlandığında XP + rozet kazanan kullanıcı bir sonraki haftayı bekler hale gelir.

Etkileşim tetikleyicileri:
- Haftalık geri dönüş ritüeli → açılma oranı artışı
- Görev = içerik üretme mecburiyeti → feed zenginleşir
- Topluluk yarışması → sosyal baskı ve rekabet
- Özel ödüller + FOMO → tamamlama motivasyonu

---

## 2.2 Görev Türleri

```typescript
type ChallengeType =
  | 'cook_and_share'      // Tarifi yap ve paylaş
  | 'discover_cuisine'    // Yeni bir mutfağı keşfet
  | 'ingredient_focus'    // Belirli malzemeyle tarif
  | 'technique_master'    // Belirli tekniği öğren ve uygula
  | 'local_find'          // Mahalleden bir lezzet keşfet
  | 'chain_starter'       // Tarif zinciri başlat
  | 'embed_curate'        // Instagram/TikTok'tan ilham al ve paylaş
  | 'speed_cook';         // 15 dakikada hazırlan

type Challenge = {
  id: string;
  weekNumber: number;
  year: number;
  type: ChallengeType;
  title: string;
  description: string;
  targetCuisine?: string;
  targetIngredient?: string;
  targetTechnique?: string;
  xpReward: number;
  badgeReward?: string;
  specialUnlock?: string;
  participantCount: number;
  deadline: string;           // Pazar 23:59
  difficulty: 'easy' | 'medium' | 'hard';
  isPersonalized: boolean;
};
```

---

## 2.3 Kişiselleştirme Mantığı

```typescript
const assignPersonalizedChallenge = async (
  userId: string,
  profile: PalateProfile
): Promise<Challenge> => {

  // Strateji: kullanıcının ZEKİF OLDUĞU ama YETERİNCE KEŞFETMEDİĞİ alana yönlendir
  // "Gelişim bölgesi" hissi en güçlü motivasyonu yaratır

  const weakCuisines = Object.entries(profile.cuisines)
    .filter(([_, score]) => score < 30)
    .map(([cuisine]) => cuisine);

  const strongCuisines = Object.entries(profile.cuisines)
    .filter(([_, score]) => score > 60)
    .map(([cuisine]) => cuisine);

  // Zayıf mutfağa köprü kur: güçlü mutfakla ortak malzemeyi hedefle
  if (weakCuisines.length > 0 && strongCuisines.length > 0) {
    return generateBridgeChallenge(strongCuisines[0], weakCuisines[0]);
  }

  return getWeeklyGlobalChallenge();
};
```

---

## 2.4 Firebase Veri Yapısı

```
Firestore Collections:

/challenges/{weekId}                          ← Global haftalık görev
/challenges/{weekId}/participants/{userId}    ← Katılımcı kaydı
/users/{userId}/challenges/{weekId}           ← Kullanıcı ilerleme durumu
/users/{userId}/personalizedChallenges/{weekId} ← AI kişisel görev
```

```typescript
type ChallengeParticipant = {
  userId: string;
  username: string;
  avatarUrl: string;
  joinedAt: string;
  completedAt?: string;
  postId?: string;
  xpEarned: number;
  rank?: number;
};

type UserChallengeProgress = {
  challengeId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'missed';
  startedAt?: string;
  completedAt?: string;
  postId?: string;
  xpEarned: number;
};
```

---

## 2.5 Firebase Cloud Functions — Görev Yönetimi

```typescript
// Her Pazartesi 09:00'da yeni görev yayınla (Türkiye saati)
export const publishWeeklyChallenge = functions.pubsub
  .schedule('0 9 * * 1')
  .timeZone('Europe/Istanbul')
  .onRun(async () => {
    const db = admin.firestore();
    const weekId = getCurrentWeekId(); // "2026-W08"

    const globalChallenge = await generateGlobalChallenge();
    await db.doc(`challenges/${weekId}`).set(globalChallenge);

    // Aktif kullanıcılara push notification
    const users = await db.collection('users')
      .where('lastActive', '>', getLastWeekDate())
      .get();

    const tokens = users.docs
      .map(d => d.data().fcmToken)
      .filter(Boolean);

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: '🎯 Yeni Haftalık Görev!',
        body: globalChallenge.title,
      },
    });
  });

// Görev tamamlandığında XP ver
export const onChallengeCompleted = functions.firestore
  .document('users/{userId}/challenges/{weekId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== 'completed' && after.status === 'completed') {
      const { userId, weekId } = context.params;
      const db = admin.firestore();

      const challenge = await db.doc(`challenges/${weekId}`).get();
      const xp = challenge.data()?.xpReward ?? 100;

      // XP ver
      await db.doc(`users/${userId}`).update({
        xp: admin.firestore.FieldValue.increment(xp),
      });

      // Katılımcı listesini güncelle
      await db.doc(`challenges/${weekId}/participants/${userId}`).update({
        completedAt: new Date().toISOString(),
        xpEarned: xp,
        postId: after.postId,
      });

      // Rozet ver
      if (challenge.data()?.badgeReward) {
        await awardBadge(userId, challenge.data()!.badgeReward);
      }

      // Bitiş saatine 24 saat kala hatırlatma scheduled
      await scheduleReminderIfNeeded(userId, weekId, challenge.data()!.deadline);
    }
  });
```

---

## 2.6 React Native Hook'ları

```typescript
const useWeeklyChallenge = () => {
  const { user } = useAuthStore();
  const weekId = getCurrentWeekId();

  const { data: globalChallenge } = useQuery({
    queryKey: ['challenge', weekId],
    queryFn: () => getDoc(doc(db, 'challenges', weekId))
      .then(d => d.data() as Challenge),
  });

  const { data: personalChallenge } = useQuery({
    queryKey: ['personalChallenge', user?.uid, weekId],
    queryFn: () => getDoc(
      doc(db, 'users', user!.uid, 'personalizedChallenges', weekId)
    ).then(d => d.exists() ? d.data() as Challenge : undefined),
  });

  const { data: progress } = useQuery({
    queryKey: ['challengeProgress', user?.uid, weekId],
    queryFn: () => getDoc(
      doc(db, 'users', user!.uid, 'challenges', weekId)
    ).then(d => d.data() as UserChallengeProgress),
  });

  return {
    challenge: personalChallenge ?? globalChallenge,
    progress,
    isPersonalized: !!personalChallenge,
  };
};

const useCompleteChallenge = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const completeChallenge = async (weekId: string, postId: string) => {
    await updateDoc(
      doc(db, 'users', user!.uid, 'challenges', weekId),
      { status: 'completed', completedAt: serverTimestamp(), postId }
    );
    queryClient.invalidateQueries({ queryKey: ['challengeProgress'] });
  };

  return { completeChallenge };
};
```

---

## 2.7 UI Bileşenleri

### Görev Kartı (Feed üstünde sabit banner)

```
┌────────────────────────────────────────────────────┐
│  🎯 Bu Haftanın Görevi          ⏳ 3 gün 14 saat  │
│                                                    │
│  "Hiç Japon yemeği yapmadın —                     │
│   Bu hafta bir ramen tarifi dene ve paylaş!"       │
│                                                    │
│  🏆 Ödül: 150 XP + Kaşif Rozeti                  │
│  👥 847 kişi katıldı                              │
│                                                    │
│  [Göreve Katıl →]          [Lider Tablosu]        │
└────────────────────────────────────────────────────┘
```

### Lider Tablosu

```
┌─────────────────────────────────┐
│  🏆 Bu Hafta Öne Çıkanlar       │
│                                 │
│  1. 🥇 @ayse_mutfakta   +150xp  │
│  2. 🥈 @sokak_gurme     +150xp  │
│  3. 🥉 @lezzetkasfii    +150xp  │
│  ...                            │
│  47. Sen               +0xp ←  │  ← Her zaman görünür
└─────────────────────────────────┘
```

Görevi tamamlayanların gönderileri feed'de özel **"Görev ✓"** etiketiyle öne çıkar.

---
---

# BÖLÜM 3 — 🔗 Tarif Zinciri

## 3.1 Konsept & Etkileşim Hedefi

Bir kullanıcı tarif paylaşır. Başkası o tarifi yapar, kendi yorumuyla ekler, zincir büyür.
Platform bunu görsel bir ağaç olarak takip eder. Kök tarifte olan kullanıcı zincir büyüdükçe
pasif XP kazanmaya devam eder — bu paylaşma motivasyonunu köklü biçimde artırır.

Etkileşim tetikleyicileri:
- Zincire eklenmek = etiketlenme = bildirim = geri dönüş
- Pasif XP kazanımı → "en çok yayılan tarif" statüsü için rekabet
- Zincir görselleştirmesi → "benim tarif zincirim 47 halkaya ulaştı" paylaşılabilir başarı
- Haftalık görevle cross-entegrasyon → "Bu hafta zincir başlat" görevi

---

## 3.2 Veri Modeli

```typescript
type RecipeChain = {
  id: string;
  rootPostId: string;
  rootUserId: string;
  title: string;
  totalLinks: number;
  totalLikes: number;
  isActive: boolean;        // 7 günde yeni ekleme olmadıysa pasif
  tags: string[];
  createdAt: string;
  lastActivityAt: string;
};

type ChainLink = {
  id: string;
  chainId: string;
  postId: string;
  userId: string;
  parentLinkId: string | null;  // null = kök halka
  depth: number;                // 0 = kök
  variation: string;            // Kullanıcının kendi yorumu
  likeCount: number;
  childCount: number;
  addedAt: string;
};
```

---

## 3.3 Firebase Veri Yapısı

```
Firestore Collections:

/chains/{chainId}                    ← Zincir meta verisi
/chains/{chainId}/links/{linkId}     ← Zincir halkaları
/posts/{postId}/
  chainId?: string                   ← Gönderi zincire bağlıysa
  chainLinkId?: string
  isChainRoot?: boolean
```

---

## 3.4 Firebase Cloud Functions — Zincir Yönetimi

```typescript
export const onChainLinkAdded = functions.firestore
  .document('chains/{chainId}/links/{linkId}')
  .onCreate(async (snap, context) => {
    const { chainId } = context.params;
    const link = snap.data() as ChainLink;
    const db = admin.firestore();

    // Zincir sayacını güncelle
    await db.doc(`chains/${chainId}`).update({
      totalLinks: admin.firestore.FieldValue.increment(1),
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Yeni halka ekleyen kullanıcıya XP ver
    await db.doc(`users/${link.userId}`).update({
      xp: admin.firestore.FieldValue.increment(20),
    });

    // Kök sahibine pasif XP ver + bildirim gönder
    const chain = await db.doc(`chains/${chainId}`).get();
    const rootUserId = chain.data()?.rootUserId;

    if (rootUserId && rootUserId !== link.userId) {
      await db.doc(`users/${rootUserId}`).update({
        xp: admin.firestore.FieldValue.increment(10),
      });

      const linker = await db.doc(`users/${link.userId}`).get();
      await db.collection('notifications').add({
        recipientId: rootUserId,
        senderId: link.userId,
        type: 'chain_extended',
        title: 'Tarif Zinciriniz Büyüdü! 🔗',
        body: `${linker.data()?.username} tarifinizi yapıp zincire ekledi`,
        metadata: { chainId, linkId: snap.id },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Üst halka sahibine bildirim gönder
    if (link.parentLinkId) {
      const parentLink = await db
        .doc(`chains/${chainId}/links/${link.parentLinkId}`)
        .get();
      const parentUserId = parentLink.data()?.userId;

      if (parentUserId && parentUserId !== link.userId) {
        await db.collection('notifications').add({
          recipientId: parentUserId,
          senderId: link.userId,
          type: 'chain_reply',
          title: 'Tarifiniz İlham Verdi! ✨',
          body: 'Tarifinizden ilham alıp kendi versiyonunu paylaştı',
          metadata: { chainId, linkId: snap.id },
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // Milestone bildirimleri (10, 25, 50, 100 halka)
    const newTotal = (chain.data()?.totalLinks ?? 0) + 1;
    if ([10, 25, 50, 100].includes(newTotal) && rootUserId) {
      await db.collection('notifications').add({
        recipientId: rootUserId,
        type: 'chain_milestone',
        title: `Zinciriniz ${newTotal} Halkaya Ulaştı! 🎉`,
        body: 'Tarifiniz topluluğa ilham vermeye devam ediyor',
        metadata: { chainId, milestone: newTotal },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
```

---

## 3.5 React Native Hook'ları

```typescript
// Zincir detayı + ağaç yapısı
const useRecipeChain = (chainId: string) => {
  const { data: chain } = useQuery({
    queryKey: ['chain', chainId],
    queryFn: () => getDoc(doc(db, 'chains', chainId))
      .then(d => ({ id: d.id, ...d.data() } as RecipeChain)),
  });

  const { data: links } = useQuery({
    queryKey: ['chainLinks', chainId],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'chains', chainId, 'links'),
          orderBy('depth', 'asc'),
          orderBy('addedAt', 'asc')
        )
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChainLink));
    },
  });

  const treeData = useMemo(() => buildChainTree(links ?? []), [links]);
  return { chain, links, treeData };
};

// Zincire katıl
const useJoinChain = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const joinChain = async ({
    chainId, parentLinkId, postId, variation,
  }: {
    chainId: string; parentLinkId: string;
    postId: string; variation: string;
  }) => {
    const parentLink = await getDoc(
      doc(db, 'chains', chainId, 'links', parentLinkId)
    );

    await addDoc(collection(db, 'chains', chainId, 'links'), {
      chainId, postId,
      userId: user!.uid,
      parentLinkId,
      depth: (parentLink.data()?.depth ?? 0) + 1,
      variation,
      likeCount: 0,
      childCount: 0,
      addedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'posts', postId), { chainId });
    queryClient.invalidateQueries({ queryKey: ['chain', chainId] });
  };

  return { joinChain };
};

// Yeni zincir başlat
const useStartChain = () => {
  const { user } = useAuthStore();

  const startChain = async (postId: string, title: string, tags: string[]) => {
    const chainRef = await addDoc(collection(db, 'chains'), {
      rootPostId: postId,
      rootUserId: user!.uid,
      title, tags,
      totalLinks: 1,
      totalLikes: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'chains', chainRef.id, 'links'), {
      chainId: chainRef.id,
      postId, userId: user!.uid,
      parentLinkId: null,
      depth: 0,
      variation: 'Orijinal tarif',
      likeCount: 0, childCount: 0,
      addedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'posts', postId), {
      chainId: chainRef.id,
      isChainRoot: true,
    });

    return chainRef.id;
  };

  return { startChain };
};

// Ağaç yapısı builder
const buildChainTree = (links: ChainLink[]): TreeNode[] => {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  links.forEach(link => map.set(link.id, { ...link, children: [] }));
  links.forEach(link => {
    if (!link.parentLinkId) roots.push(map.get(link.id)!);
    else map.get(link.parentLinkId)?.children.push(map.get(link.id)!);
  });

  return roots;
};
```

---

## 3.6 Zincir Kartı (Feed Görünümü)

```
┌─────────────────────────────────────────────┐
│  🔗 Tarif Zinciri                           │
│  "Ev Yapımı Ramen" — 23 halka              │
│                                             │
│  [😊]→[👨‍🍳]→[👩‍🍳]→[🧑‍🍳]→[+19 kişi daha] │
│                                             │
│  En çok beğenilen: @ayse_mutfakta versiyonu │
│  [Zinciri Gör]          [Bu Tarifi Yap →]  │
└─────────────────────────────────────────────┘
```

Zincir ağacı görselleştirmesi için `react-native-svg` ile node'lar arası bağlantı çizgileri,
her node tıklanınca ilgili gönderi açılır.

---
---

# BÖLÜM 4 — 🔄 Modüller Arası Entegrasyon

## 4.1 Etkileşim Flywheel'i

```
        ┌─────────────────────────────┐
        │      AI Damak Profili       │
        │   (Davranış öğreniliyor)    │
        └────────────┬────────────────┘
                     │ profil analizi
                     ▼
        ┌─────────────────────────────┐
        │   Haftalık Lezzet Görevi    │◄──────────────┐
        │  (Kişiselleştirilmiş görev) │               │
        └────────────┬────────────────┘               │
                     │ görevi tamamla                  │ yeni etkileşimler
                     │ = gönderi paylaş                │ profili günceller
                     ▼                                 │
        ┌─────────────────────────────┐               │
        │       Tarif Zinciri         │               │
        │  (Başkası katılır, büyür)   │               │
        └────────────┬────────────────┘               │
                     │ bildirim gelir                  │
                     │ geri dön, beğen, yorum yap      │
                     └────────────────────────────────►┘
```

## 4.2 Cross-Modül XP Tablosu

```typescript
const CROSS_MODULE_XP = {
  // AI Damak Profili
  palate_profile_completed:  25,  // İlk 50 sinyal tamamlandı
  palate_persona_assigned:   30,  // Persona belirlendi
  palate_card_shared:        15,  // Damak kartı paylaşıldı

  // Haftalık Görev
  challenge_joined:          10,
  challenge_completed:      150,
  challenge_top_3:           50,  // İlk 3'e girdi bonus
  challenge_streak_3_weeks:  75,  // 3 hafta üst üste tamamladı

  // Tarif Zinciri
  chain_started:             30,
  chain_link_added:          20,
  chain_milestone_10:        40,
  chain_milestone_25:        80,
  chain_milestone_50:       150,
  chain_passive_per_link:    10,  // Birisi kendi zincirine ekledi
};
```

## 4.3 Yeni Bildirim Türleri

```typescript
// Mevcut bildirim türlerine eklenenler:
type NotificationType =
  | 'chain_extended'      // Zinciriniz büyüdü
  | 'chain_reply'         // Tarifinizden ilham aldı
  | 'chain_milestone'     // Zincir milestone (10/25/50/100)
  | 'challenge_new'       // Yeni haftalık görev yayınlandı
  | 'challenge_reminder'  // Göreve 24 saat kaldı
  | 'challenge_completed' // Görev tamamlandı + XP kazanıldı
  | 'palate_persona'      // Yeni persona belirlendi
  | 'palate_insight';     // "Bu hafta 3 yeni mutfak keşfettin!"
```

---

# BÖLÜM 5 — 📦 Kurulum & Bağımlılıklar

## 5.1 Firebase Kurulumu

```bash
# React Native Firebase SDK
npm install @react-native-firebase/app
npm install @react-native-firebase/firestore
npm install @react-native-firebase/auth
npm install @react-native-firebase/storage
npm install @react-native-firebase/messaging
npm install @react-native-firebase/functions

# iOS için ek adım
cd ios && pod install

# Cloud Functions geliştirme
npm install -g firebase-tools
firebase login
firebase init functions
cd functions && npm install typescript firebase-admin firebase-functions
```

## 5.2 Yeni UI Bağımlılıkları

```bash
# Zincir ağacı görselleştirme
npm install react-native-svg

# Damak kartı paylaşımı (view → image)
npm install react-native-view-shot

# Countdown timer
npm install react-native-countdown-timer-hooks

# Sonsuz scroll / query yönetimi
npm install @tanstack/react-query
```

## 5.3 Firebase Firestore İndeksleri

```json
{
  "indexes": [
    {
      "collectionGroup": "links",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "chainId", "order": "ASCENDING" },
        { "fieldPath": "depth", "order": "ASCENDING" },
        { "fieldPath": "addedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "challenges",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "weekNumber", "order": "DESCENDING" },
        { "fieldPath": "year", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "signals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "participants",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "completedAt", "order": "ASCENDING" },
        { "fieldPath": "xpEarned", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## 5.4 Geliştirme Öncelikleri

| # | Modül | Görev | Öncelik |
|---|-------|-------|---------|
| 1 | AI Damak | `useViewTracking` + `useSendSignal` hook'ları | Kritik |
| 2 | AI Damak | Cloud Function: profil güncelleme + persona atama | Kritik |
| 3 | Haftalık Görev | Global görev yayınlama + push notification | Kritik |
| 4 | Tarif Zinciri | `useStartChain` + `useJoinChain` hook'ları | Kritik |
| 5 | AI Damak | DamakKarterim UI bileşeni + paylaşım | Yüksek |
| 6 | Haftalık Görev | Görev kartı + lider tablosu UI | Yüksek |
| 7 | Tarif Zinciri | Zincir ağacı görselleştirmesi (SVG) | Yüksek |
| 8 | Haftalık Görev | AI kişiselleştirme entegrasyonu | Orta |
| 9 | Tarif Zinciri | Milestone bildirim sistemi | Orta |
| 10 | Entegrasyon | Cross-modül XP tablosu + bildirim türleri | Orta |

---

*Döküman versiyonu: 1.0 | Son güncelleme: Şubat 2026*
*Kapsam: AI Damak Profili · Haftalık Lezzet Görevi · Tarif Zinciri*
