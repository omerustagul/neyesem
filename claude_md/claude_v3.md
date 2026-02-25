# 🚀 Neyesem — Çağ Atlatan Modüller v1.0
## Malzeme DNA'sı · Usta-Çırak · Mevsim Takvimi · Pişirme Maratonu · Lezzet Pasaportu · Aile Tarif Arşivi

> **Vizyon:** Bu 6 modül uygulamayı bir sosyal medya platformundan çıkarıp
> insanların gerçek mutfak hayatlarının dijital merkezine dönüştürür.
> Her modül bağımsız çalışır, birlikte ise birbirini besleyen bir ekosistem oluşturur.

---

# BÖLÜM 1 — 🧬 Malzeme DNA'sı

## 1.1 Konsept

Kullanıcı buzdolabını veya market alışverişini fotoğraflıyor. AI görüntüdeki malzemeleri
tespit ediyor, platformdaki tariflerle eşleştiriyor ve "Bu malzemelerle bugün ne pişirebilirsin?"
sorusuna anında cevap veriyor. Günlük kullanım alışkanlığı yaratan en güçlü mekanizma.

**Etkileşim döngüsü:**
Fotoğraf çek → Malzemeler tespit edildi → Tarif önerildi → Tarif yapıldı & paylaşıldı
→ Zincire eklendi → XP kazanıldı → Yarın tekrar fotoğraf çek

---

## 1.2 Teknik Mimari

```
Kullanıcı fotoğraf çeker
        ↓
React Native (expo-camera)
        ↓
Firebase Storage'a yüklenir
        ↓
Cloud Function tetiklenir
        ↓
Google Cloud Vision API (malzeme tespiti)
        ↓
Tespit edilen malzemeler → Firestore'a yazılır
        ↓
Firestore query → Eşleşen tarifler bulunur
        ↓
Kullanıcıya sonuçlar döner
```

---

## 1.3 Veri Modeli

```typescript
type DetectedIngredient = {
  name: string;           // "domates", "soğan", "sarımsak"
  confidence: number;     // 0-1 arası güven skoru
  category: IngredientCategory;
  seasonalScore?: number; // Mevsim Takvimi modülüyle entegrasyon
};

type IngredientCategory =
  | 'vegetable' | 'fruit' | 'meat' | 'seafood'
  | 'dairy' | 'grain' | 'spice' | 'herb' | 'other';

type IngredientScan = {
  id: string;
  userId: string;
  imageUrl: string;
  detectedIngredients: DetectedIngredient[];
  suggestedRecipeIds: string[];   // Eşleşen tarifler
  matchScores: Record<string, number>; // postId → eşleşme skoru
  scannedAt: string;
  status: 'processing' | 'completed' | 'failed';
};

type UserPantry = {
  userId: string;
  ingredients: {
    name: string;
    addedAt: string;
    expiresAt?: string;   // Opsiyonel son kullanma tarihi
    source: 'scan' | 'manual';
  }[];
  lastUpdated: string;
};
```

---

## 1.4 Firebase Veri Yapısı

```
Firestore Collections:

/ingredient_scans/{scanId}          ← Tarama kayıtları
/users/{userId}/pantry              ← Kullanıcının mutfak dolabı
/posts/{postId}/ingredients[]       ← Her tarifin malzeme listesi (index için)

Firebase Storage:
/scans/{userId}/{scanId}.jpg        ← Tarama görselleri
```

---

## 1.5 Cloud Function — Görüntü Analizi

```typescript
// functions/src/analyzeIngredients.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ImageAnnotatorClient } from '@google-cloud/vision';

const visionClient = new ImageAnnotatorClient();

export const analyzeIngredientScan = functions.firestore
  .document('ingredient_scans/{scanId}')
  .onCreate(async (snap, context) => {
    const scan = snap.data() as IngredientScan;
    const db = admin.firestore();

    try {
      // Google Vision API ile label detection
      const [result] = await visionClient.labelDetection(scan.imageUrl);
      const labels = result.labelAnnotations ?? [];

      // Yemek malzemelerini filtrele
      const foodLabels = labels
        .filter(l => (l.score ?? 0) > 0.7)
        .filter(l => isFoodIngredient(l.description ?? ''))
        .map(l => ({
          name: translateToTurkish(l.description ?? ''),
          confidence: l.score ?? 0,
          category: categorizeIngredient(l.description ?? ''),
        }));

      // Eşleşen tarifleri bul
      const matchedRecipes = await findMatchingRecipes(
        foodLabels.map(f => f.name),
        scan.userId
      );

      // Taramayı güncelle
      await snap.ref.update({
        detectedIngredients: foodLabels,
        suggestedRecipeIds: matchedRecipes.map(r => r.id),
        matchScores: matchedRecipes.reduce((acc, r) => ({
          ...acc, [r.id]: r.score
        }), {}),
        status: 'completed',
      });

      // Kullanıcının mutfak dolabını güncelle
      await db.doc(`users/${scan.userId}/pantry`).set({
        ingredients: foodLabels.map(f => ({
          name: f.name,
          addedAt: new Date().toISOString(),
          source: 'scan',
        })),
        lastUpdated: new Date().toISOString(),
      }, { merge: true });

    } catch (error) {
      await snap.ref.update({ status: 'failed' });
    }
  });

// Malzeme bazlı tarif eşleştirme
const findMatchingRecipes = async (
  ingredients: string[],
  userId: string
): Promise<{ id: string; score: number }[]> => {
  const db = admin.firestore();

  // Takip edilen kullanıcıların tariflerini öncelikle göster
  const follows = await db.collection('follows')
    .where('followerId', '==', userId)
    .get();
  const followingIds = follows.docs.map(d => d.data().followingId);

  const posts = await db.collection('posts')
    .where('type', 'in', ['photo', 'video'])
    .where('ingredients', 'array-contains-any', ingredients)
    .limit(20)
    .get();

  return posts.docs
    .map(doc => {
      const post = doc.data();
      const postIngredients: string[] = post.ingredients ?? [];
      const matchCount = ingredients.filter(i =>
        postIngredients.includes(i)
      ).length;
      const score = matchCount / Math.max(postIngredients.length, 1);
      // Takip edilen kullanıcının tarifi ise skor bonusu
      const followBonus = followingIds.includes(post.userId) ? 0.2 : 0;
      return { id: doc.id, score: score + followBonus };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};
```

---

## 1.6 React Native Hook'ları

```typescript
// Fotoğraf çek ve analiz et
const useIngredientScan = () => {
  const { user } = useAuthStore();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<IngredientScan | null>(null);

  const scanIngredients = async (imageUri: string) => {
    setIsScanning(true);

    // 1. Görseli Storage'a yükle
    const storageRef = ref(storage, `scans/${user!.uid}/${Date.now()}.jpg`);
    await uploadBytes(storageRef, await uriToBlob(imageUri));
    const imageUrl = await getDownloadURL(storageRef);

    // 2. Firestore'a tarama kaydı oluştur (Cloud Function tetikler)
    const scanRef = await addDoc(collection(db, 'ingredient_scans'), {
      userId: user!.uid,
      imageUrl,
      detectedIngredients: [],
      suggestedRecipeIds: [],
      matchScores: {},
      status: 'processing',
      scannedAt: serverTimestamp(),
    });

    // 3. Sonuç gelene kadar dinle (realtime)
    const unsubscribe = onSnapshot(scanRef, (doc) => {
      const data = doc.data() as IngredientScan;
      if (data.status === 'completed' || data.status === 'failed') {
        setResult(data);
        setIsScanning(false);
        unsubscribe();
      }
    });
  };

  return { scanIngredients, isScanning, result };
};

// Mutfak dolabı yönetimi
const usePantry = () => {
  const { user } = useAuthStore();

  const { data: pantry } = useQuery({
    queryKey: ['pantry', user?.uid],
    queryFn: () => getDoc(doc(db, 'users', user!.uid, 'pantry'))
      .then(d => d.data() as UserPantry),
  });

  const addIngredient = async (name: string) => {
    await updateDoc(doc(db, 'users', user!.uid, 'pantry'), {
      ingredients: arrayUnion({
        name, addedAt: new Date().toISOString(), source: 'manual'
      }),
      lastUpdated: new Date().toISOString(),
    });
  };

  const removeIngredient = async (name: string) => {
    const current = pantry?.ingredients.find(i => i.name === name);
    if (current) {
      await updateDoc(doc(db, 'users', user!.uid, 'pantry'), {
        ingredients: arrayRemove(current),
      });
    }
  };

  return { pantry, addIngredient, removeIngredient };
};
```

---

## 1.7 UI Akışı

```
┌─────────────────────────────────┐
│  🧬 Bugün Ne Pişirsem?          │
│                                 │
│  [📷 Buzdolabını Tara]          │  ← Büyük CTA butonu
│  [✏️ Manuel Ekle]               │
│                                 │
│  Son taramamdan:                │
│  🍅 Domates  🧅 Soğan  🧄 Sarımsak │
│  🥕 Havuç   🫑 Biber            │
│                                 │
│  Bu Malzemelerle:               │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Tarif1│ │Tarif2│ │Tarif3│   │
│  │  92% │ │  87% │ │  74% │   │  ← Eşleşme skoru
│  └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────┘
```

---
---

# BÖLÜM 2 — 🏅 Usta-Çırak Sistemi

## 2.1 Konsept

Platformda belirli seviyeye ulaşmış kullanıcılar yeni başlayanlara usta olabiliyor.
Çırak ustasının tarifini yapıp paylaşıyor, usta video veya metin geri bildirimi veriyor.
İkisi de XP kazanıyor. "X kişinin ustasıyım" statüsü platforma kimsenin kopyalayamayacağı
sosyal doku işliyor.

**Usta olma şartı:** Level 5 (Sous Chef) ve üzeri
**Maksimum çırak sayısı:** Level'a göre artar (Level 5: 3, Level 6: 5, Level 7: 10, Level 8+: sınırsız)

---

## 2.2 Veri Modeli

```typescript
type MentorshipStatus =
  | 'pending'    // Çırak başvurdu, usta onaylamadı
  | 'active'     // Aktif usta-çırak ilişkisi
  | 'completed'  // Çırak belirli seviyeye ulaştı, mezun oldu
  | 'cancelled'; // İptal edildi

type Mentorship = {
  id: string;
  mentorId: string;       // Usta
  apprenticeId: string;   // Çırak
  status: MentorshipStatus;
  speciality: string;     // Uzmanlaşma alanı: "Türk mutfağı", "Hamur işleri" vb.
  startedAt?: string;
  completedAt?: string;
  requestMessage: string; // Çırağın başvuru mesajı
  totalFeedbacks: number;
  apprenticeStartLevel: number;
  apprenticeCurrentLevel: number;
  graduationLevel: number; // Mezuniyet seviyesi (varsayılan: 4)
  xpSharedTotal: number;   // Ustanın bu ilişkiden kazandığı toplam XP
};

type MentorFeedback = {
  id: string;
  mentorshipId: string;
  mentorId: string;
  apprenticeId: string;
  postId: string;           // Geri bildirim verilen gönderi
  feedbackType: 'text' | 'video' | 'audio';
  content: string;          // Metin geri bildirimi veya medya URL'i
  rating: 1 | 2 | 3 | 4 | 5;
  tags: FeedbackTag[];
  createdAt: string;
};

type FeedbackTag =
  | 'technique'    // Teknik
  | 'presentation' // Sunum
  | 'timing'       // Pişirme süresi
  | 'seasoning'    // Baharat/tat
  | 'creativity'   // Yaratıcılık
  | 'improvement'; // Gelişim alanı
```

---

## 2.3 Firebase Veri Yapısı

```
Firestore Collections:

/mentorships/{mentorshipId}                    ← İlişki kayıtları
/mentorships/{mentorshipId}/feedbacks/{fbId}   ← Geri bildirimler
/users/{userId}/mentorProfile                  ← Usta profili
/users/{userId}/apprenticeProfile              ← Çırak profili

Örnek mentorProfile dökümanı:
{
  totalApprentices: 12,
  activeApprentices: 3,
  graduatedApprentices: 9,
  specialities: ["Türk mutfağı", "Hamur işleri"],
  acceptingNewApprentices: true,
  averageRating: 4.8,
  bio: "20 yıldır ev yemekleri yapıyorum..."
}
```

---

## 2.4 Cloud Functions

```typescript
// Çırak başvurusu onaylandığında
export const onMentorshipActivated = functions.firestore
  .document('mentorships/{mentorshipId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Mentorship;
    const after = change.after.data() as Mentorship;
    const db = admin.firestore();

    // Pending → Active geçişi
    if (before.status === 'pending' && after.status === 'active') {
      // Her ikisine de bildirim gönder
      await Promise.all([
        db.collection('notifications').add({
          recipientId: after.apprenticeId,
          senderId: after.mentorId,
          type: 'mentorship_accepted',
          title: 'Başvurunuz Kabul Edildi! 🎉',
          body: 'Artık bir ustanız var. Öğrenme yolculuğunuz başlıyor!',
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
        db.collection('notifications').add({
          recipientId: after.mentorId,
          senderId: after.apprenticeId,
          type: 'mentorship_started',
          title: 'Yeni Çırağınız Hazır!',
          body: 'Çırağınız öğrenmeye başlamak için sabırsızlanıyor',
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
      ]);

      // Her ikisine XP ver
      await Promise.all([
        db.doc(`users/${after.mentorId}`).update({
          xp: admin.firestore.FieldValue.increment(30),
        }),
        db.doc(`users/${after.apprenticeId}`).update({
          xp: admin.firestore.FieldValue.increment(20),
        }),
      ]);
    }

    // Mezuniyet kontrolü
    if (after.status === 'active') {
      const apprentice = await db.doc(`users/${after.apprenticeId}`).get();
      const currentLevel = apprentice.data()?.level ?? 1;

      if (currentLevel >= after.graduationLevel) {
        await change.after.ref.update({
          status: 'completed',
          completedAt: new Date().toISOString(),
          apprenticeCurrentLevel: currentLevel,
        });

        // Mezuniyet XP ve rozetleri
        await db.doc(`users/${after.mentorId}`).update({
          xp: admin.firestore.FieldValue.increment(100),
        });
        await db.doc(`users/${after.apprenticeId}`).update({
          xp: admin.firestore.FieldValue.increment(75),
        });

        // Mezuniyet bildirimleri
        await db.collection('notifications').add({
          recipientId: after.apprenticeId,
          type: 'mentorship_graduated',
          title: '🎓 Mezun Oldunuz!',
          body: 'Ustanızdan mezun oldunuz. Artık siz de başkalarına usta olabilirsiniz!',
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  });

// Geri bildirim verilince XP dağıt
export const onFeedbackCreated = functions.firestore
  .document('mentorships/{mentorshipId}/feedbacks/{feedbackId}')
  .onCreate(async (snap, context) => {
    const feedback = snap.data() as MentorFeedback;
    const db = admin.firestore();

    await Promise.all([
      db.doc(`users/${feedback.mentorId}`).update({
        xp: admin.firestore.FieldValue.increment(15),
      }),
      db.doc(`users/${feedback.apprenticeId}`).update({
        xp: admin.firestore.FieldValue.increment(10),
      }),
      db.collection('notifications').add({
        recipientId: feedback.apprenticeId,
        senderId: feedback.mentorId,
        type: 'mentor_feedback',
        title: 'Ustanızdan Geri Bildirim Var! 👨‍🍳',
        body: 'Tarifiniz için geri bildirim aldınız',
        metadata: { postId: feedback.postId, feedbackId: snap.id },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ]);
  });
```

---

## 2.5 React Native Hook'ları

```typescript
// Usta arama
const useFindMentors = (speciality?: string) => {
  return useQuery({
    queryKey: ['mentors', speciality],
    queryFn: async () => {
      let q = query(
        collection(db, 'users'),
        where('level', '>=', 5),
        where('mentorProfile.acceptingNewApprentices', '==', true),
        orderBy('mentorProfile.averageRating', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
  });
};

// Usta-çırak ilişkisi yönetimi
const useMentorship = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Mevcut ilişkiyi getir
  const { data: activeMentorship } = useQuery({
    queryKey: ['mentorship', user?.uid],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'mentorships'),
          where('apprenticeId', '==', user!.uid),
          where('status', '==', 'active'),
          limit(1)
        )
      );
      return snap.empty ? null : snap.docs[0].data() as Mentorship;
    },
  });

  // Usta başvurusu
  const applyToMentor = async (mentorId: string, message: string, speciality: string) => {
    await addDoc(collection(db, 'mentorships'), {
      mentorId,
      apprenticeId: user!.uid,
      status: 'pending',
      speciality,
      requestMessage: message,
      totalFeedbacks: 0,
      apprenticeStartLevel: useAuthStore.getState().profile?.level ?? 1,
      apprenticeCurrentLevel: useAuthStore.getState().profile?.level ?? 1,
      graduationLevel: 4,
      xpSharedTotal: 0,
      createdAt: serverTimestamp(),
    });
    queryClient.invalidateQueries({ queryKey: ['mentorship'] });
  };

  // Geri bildirim ver
  const giveFeedback = async (
    mentorshipId: string,
    postId: string,
    content: string,
    rating: number,
    tags: FeedbackTag[]
  ) => {
    await addDoc(
      collection(db, 'mentorships', mentorshipId, 'feedbacks'),
      {
        mentorId: user!.uid,
        apprenticeId: activeMentorship?.apprenticeId,
        postId, content, rating, tags,
        feedbackType: 'text',
        createdAt: serverTimestamp(),
      }
    );
  };

  return { activeMentorship, applyToMentor, giveFeedback };
};
```

---

## 2.6 UI Akışı

```
Usta Profil Kartı:
┌─────────────────────────────────────┐
│  👨‍🍳 Ayşe Hanım                     │
│  ⭐ Level 7 — Baş Şef               │
│                                     │
│  Uzmanlık: Türk mutfağı, Börekler  │
│  👥 9 mezun çırak · 3 aktif        │
│  ⭐ 4.9 / 5 değerlendirme          │
│                                     │
│  "20 yıldır ev yemekleri..."        │
│                                     │
│  [Çıraklık Başvurusu Yap →]        │
└─────────────────────────────────────┘

Profil Sayfası Rozeti:
┌─────────────────────────────────────┐
│  🎓 Ustam: @ayse_hanim             │
│  Türk mutfağı · Level 3/4          │
│  ████████░░ %75 tamamlandı         │
└─────────────────────────────────────┘
```

---
---

# BÖLÜM 3 — 📅 Mevsim Takvimi

## 3.1 Konsept

Hangi malzemenin şu an mevsiminde olduğunu gösteren canlı takvim. Platform bunu
akıllı içerik yönlendirmesine dönüştürüyor: "Şu an mantar mevsimi — bu haftanın
en çok paylaşılan mantar tarifleri" gibi dinamik keşifler sunuyor.
Malzeme DNA'sı modülüyle doğrudan entegre.

---

## 3.2 Veri Modeli

```typescript
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

type SeasonalIngredient = {
  id: string;
  name: string;             // "Mantar"
  nameEn: string;           // "Mushroom"
  category: IngredientCategory;
  peakMonths: number[];     // [10, 11, 12] — Ekim, Kasım, Aralık
  availableMonths: number[]; // [9, 10, 11, 12, 1] — Biraz önce ve sonra
  region: string[];         // ["TR", "global"]
  nutritionHighlights: string[];
  pairingIngredients: string[]; // İyi giden diğer malzemeler
  imageUrl: string;
  funFact: string;          // "Mantarlar aslında bir bitki değil..."
};

type SeasonalContent = {
  weekId: string;           // "2026-W08"
  featuredIngredients: string[]; // O hafta öne çıkan malzemeler
  trendingRecipeIds: string[];   // O malzemeyle trend tarifler
  challengeHint?: string;        // Haftalık görevle entegrasyon
  updatedAt: string;
};
```

---

## 3.3 Firebase Veri Yapısı

```
Firestore Collections:

/seasonal_ingredients/{ingredientId}    ← Mevsimsel malzeme kataloğu
/seasonal_content/{weekId}              ← Haftalık öne çıkan içerik
/posts/{postId}/ingredients[]           ← Tarif malzemeleri (query için)
```

---

## 3.4 Cloud Function — Haftalık Mevsim İçeriği

```typescript
// Her Pazartesi 08:00'da mevsim içeriğini güncelle
export const updateSeasonalContent = functions.pubsub
  .schedule('0 8 * * 1')
  .timeZone('Europe/Istanbul')
  .onRun(async () => {
    const db = admin.firestore();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const weekId = getCurrentWeekId();

    // Bu ay mevsiminde olan malzemeleri bul
    const seasonalSnap = await db.collection('seasonal_ingredients')
      .where('peakMonths', 'array-contains', currentMonth)
      .get();

    const featuredIngredients = seasonalSnap.docs
      .map(d => d.data().name)
      .slice(0, 5);

    // Bu malzemelerle yapılan en popüler tarifleri bul
    const trendingRecipes = await db.collection('posts')
      .where('ingredients', 'array-contains-any', featuredIngredients)
      .orderBy('likeCount', 'desc')
      .limit(20)
      .get();

    await db.doc(`seasonal_content/${weekId}`).set({
      weekId,
      featuredIngredients,
      trendingRecipeIds: trendingRecipes.docs.map(d => d.id),
      updatedAt: new Date().toISOString(),
    });
  });
```

---

## 3.5 React Native Hook'ları

```typescript
const useSeasonalContent = () => {
  const weekId = getCurrentWeekId();
  const currentMonth = new Date().getMonth() + 1;

  // Bu haftanın mevsim içeriği
  const { data: weeklyContent } = useQuery({
    queryKey: ['seasonalContent', weekId],
    queryFn: () => getDoc(doc(db, 'seasonal_content', weekId))
      .then(d => d.data() as SeasonalContent),
    staleTime: 24 * 60 * 60 * 1000, // 24 saat cache
  });

  // Şu an mevsiminde olan tüm malzemeler
  const { data: inSeasonIngredients } = useQuery({
    queryKey: ['inSeason', currentMonth],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'seasonal_ingredients'),
          where('availableMonths', 'array-contains', currentMonth)
        )
      );
      return snap.docs.map(d => d.data() as SeasonalIngredient);
    },
  });

  return { weeklyContent, inSeasonIngredients };
};

// Malzeme DNA'sıyla entegrasyon
const useSeasonalScanBonus = () => {
  const { inSeasonIngredients } = useSeasonalContent();

  // Taranan malzeme mevsimindeyse bonus XP
  const getSeasonalBonus = (ingredientName: string): number => {
    const isInSeason = inSeasonIngredients?.some(
      i => i.name.toLowerCase() === ingredientName.toLowerCase()
        && i.peakMonths.includes(new Date().getMonth() + 1)
    );
    return isInSeason ? 5 : 0; // Bonus XP
  };

  return { getSeasonalBonus };
};
```

---

## 3.6 UI Akışı

```
Keşfet Sayfası — Mevsim Banner:
┌────────────────────────────────────────────────┐
│  🍄 Kasım'da Mevsiminde                       │
│                                                │
│  [Mantar] [Ayva] [Nar] [Kereviz] [Pancar]    │
│                                                │
│  En Çok Paylaşılan Mantar Tarifleri →         │
│  ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │      │ │      │ │      │                 │
│  └──────┘ └──────┘ └──────┘                 │
└────────────────────────────────────────────────┘

Malzeme Detay Kartı (tıklanınca):
┌─────────────────────────────────┐
│  🍄 Mantar                      │
│  Kasım — Aralık arası zirve     │
│                                 │
│  "Mantarlar aslında bir bitki  │
│   değil, mantar sınıfındadır." │
│                                 │
│  İyi gider: Sarımsak, Tereyağı │
│  Besin: Protein, B vitamini    │
│                                 │
│  [Bu Malzemeyle Tarif Ara →]   │
└─────────────────────────────────┘
```

---
---

# BÖLÜM 4 — 🎬 Pişirme Maratonu (Canlı Yayın)

## 4.1 Konsept

Kullanıcı canlı yayın başlatıyor, izleyenler gerçek zamanlı soru soruyor ve tepki veriyor.
Yayın bitince AI otomatik olarak adım adım tarife dönüştürüp paylaşıyor.
TikTok Live'dan farkı: içerik kalıcı ve yapılandırılmış — kaybolmuyor, tarif haline geliyor.

**Usta-Çırak entegrasyonu:** Ustalar canlı ders verebilir, çıraklar izleyebilir.

---

## 4.2 Teknik Mimari

```
Yayıncı
  ↓
Agora RTC SDK (gerçek zamanlı video/ses)
  ↓
Firebase Realtime Database (chat, tepkiler — düşük gecikme)
  ↓
Firestore (yayın meta verisi, izleyici listesi)
  ↓
Yayın Bitti
  ↓
Cloud Function → Yayın kaydını işle
  ↓
OpenAI Whisper API → Ses → Metin (transcript)
  ↓
GPT-4 → Transcript → Yapılandırılmış tarif
  ↓
Otomatik gönderi oluşturulur
```

---

## 4.3 Veri Modeli

```typescript
type LiveStreamStatus =
  | 'scheduled' | 'live' | 'ended' | 'processing' | 'published';

type LiveStream = {
  id: string;
  hostId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  status: LiveStreamStatus;
  viewerCount: number;
  peakViewerCount: number;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;           // saniye
  recordingUrl?: string;       // Yayın kaydı
  generatedPostId?: string;    // Otomatik oluşturulan tarif gönderisi
  tags: string[];
  isMentorClass: boolean;      // Usta dersi mi?
  mentorshipId?: string;
  agoraChannelName: string;    // Agora kanal adı
  agoraToken?: string;
};

type LiveMessage = {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  message: string;
  type: 'text' | 'question' | 'reaction';
  emoji?: string;
  timestamp: number;  // milliseconds (Realtime DB için)
  isPinned: boolean;
};
```

---

## 4.4 Firebase Veri Yapısı

```
Firestore Collections:
/live_streams/{streamId}               ← Yayın meta verisi

Firebase Realtime Database:
/live_chats/{streamId}/messages/       ← Gerçek zamanlı mesajlar
/live_chats/{streamId}/reactions/      ← Emoji tepkileri
/live_chats/{streamId}/viewerCount     ← Anlık izleyici sayısı

Firebase Storage:
/recordings/{streamId}.mp4             ← Yayın kaydı
```

---

## 4.5 Cloud Function — Yayın Sonrası Tarif Üretimi

```typescript
export const processEndedStream = functions.firestore
  .document('live_streams/{streamId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as LiveStream;
    const after = change.after.data() as LiveStream;

    if (before.status !== 'ended' && after.status === 'ended') {
      const { streamId } = context.params;
      const db = admin.firestore();

      await change.after.ref.update({ status: 'processing' });

      try {
        // 1. Ses kaydını metne çevir (Whisper API)
        const transcript = await transcribeAudio(after.recordingUrl!);

        // 2. GPT-4 ile tarif çıkar
        const recipeData = await extractRecipeFromTranscript(
          transcript,
          after.title
        );

        // 3. Otomatik gönderi oluştur
        const postRef = await db.collection('posts').add({
          userId: after.hostId,
          type: 'video',
          caption: recipeData.description,
          mediaUrls: [after.recordingUrl],
          ingredients: recipeData.ingredients,
          steps: recipeData.steps,
          cookingTime: recipeData.estimatedTime,
          sourceStreamId: streamId,
          isAutoGenerated: true,
          tags: after.tags,
          likeCount: 0,
          commentCount: 0,
          saveCount: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await change.after.ref.update({
          status: 'published',
          generatedPostId: postRef.id,
        });

        // Yayıncıya bildirim gönder
        await db.collection('notifications').add({
          recipientId: after.hostId,
          type: 'stream_recipe_ready',
          title: 'Tarifin Hazırlandı! 🍳',
          body: 'Canlı yayınınız otomatik tarife dönüştürüldü',
          metadata: { postId: postRef.id, streamId },
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      } catch (error) {
        await change.after.ref.update({ status: 'ended' });
      }
    }
  });

// GPT-4 ile tarif çıkarma
const extractRecipeFromTranscript = async (
  transcript: string,
  streamTitle: string
): Promise<GeneratedRecipe> => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: `Sen bir yemek tarifi asistanısın. Verilen yayın transkriptini analiz et 
                ve yapılandırılmış bir tarife dönüştür. JSON formatında yanıt ver.`,
    }, {
      role: 'user',
      content: `Yayın başlığı: ${streamTitle}\n\nTranskript:\n${transcript}`,
    }],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content ?? '{}');
};
```

---

## 4.6 React Native Hook'ları

```typescript
// Canlı yayın başlat
const useStartLiveStream = () => {
  const { user } = useAuthStore();

  const startStream = async (title: string, tags: string[], isMentorClass = false) => {
    const channelName = `stream_${user!.uid}_${Date.now()}`;

    // Agora token al (Cloud Function'dan)
    const tokenFn = httpsCallable(functions, 'getAgoraToken');
    const { data } = await tokenFn({ channelName, uid: user!.uid });

    // Yayın kaydı oluştur
    const streamRef = await addDoc(collection(db, 'live_streams'), {
      hostId: user!.uid,
      title, tags, isMentorClass,
      status: 'live',
      viewerCount: 0,
      peakViewerCount: 0,
      agoraChannelName: channelName,
      agoraToken: (data as any).token,
      startedAt: serverTimestamp(),
    });

    return { streamId: streamRef.id, channelName, token: (data as any).token };
  };

  return { startStream };
};

// Canlı yayın izle
const useWatchLiveStream = (streamId: string) => {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    // Realtime DB'den mesajları dinle
    const messagesRef = ref(rtdb, `live_chats/${streamId}/messages`);
    const viewerRef = ref(rtdb, `live_chats/${streamId}/viewerCount`);

    const msgUnsubscribe = onValue(
      query(messagesRef, limitToLast(50)),
      (snap) => {
        const data = snap.val();
        if (data) setMessages(Object.values(data));
      }
    );

    const viewerUnsubscribe = onValue(viewerRef, (snap) => {
      setViewerCount(snap.val() ?? 0);
    });

    return () => {
      msgUnsubscribe();
      viewerUnsubscribe();
    };
  }, [streamId]);

  const sendMessage = async (message: string, type: 'text' | 'question' = 'text') => {
    const { user } = useAuthStore.getState();
    const msgRef = push(ref(rtdb, `live_chats/${streamId}/messages`));
    await set(msgRef, {
      userId: user!.uid,
      username: user!.displayName,
      message, type,
      timestamp: Date.now(),
      isPinned: false,
    });
  };

  return { messages, viewerCount, sendMessage };
};
```

---

## 4.7 UI Akışı

```
Canlı Yayın Ekranı (İzleyici):
┌────────────────────────────────────┐
│  [CANLI] Ayşe Hanım'ın Börek Dersi │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │     [Video Akışı]            │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  👥 234 izleyici                   │
│                                    │
│  💬 Mesajlar:                      │
│  @kullanici: Hamur ne kadar yoğ..  │
│  @diger: Tarif paylaşılacak mı?    │
│                                    │
│  [❤️] [🔥] [😋]  [Soru Sor]       │
└────────────────────────────────────┘

Yayın Bitti Bildirimi:
┌────────────────────────────────────┐
│  🍳 Tarifin Hazırlandı!            │
│  Canlı yayın otomatik tarife       │
│  dönüştürüldü.                     │
│  [Tarifi Gör →]                    │
└────────────────────────────────────┘
```

---
---

# BÖLÜM 5 — 🗺️ Lezzet Pasaportu

## 5.1 Konsept

Kullanıcı her yeni mutfaktan tarif yapıp paylaştığında o ülkenin "damgasını" alıyor.
Profilde interaktif dünya haritası görünüyor. "12 ülkenin mutfağını keşfettim" paylaşılabilir
statü haline geliyor. Keşif ruhunu gamification ile birleştiren en görsel modül.

---

## 5.2 Veri Modeli

```typescript
type CuisineStamp = {
  cuisineId: string;
  cuisineName: string;       // "Japon Mutfağı"
  countryCode: string;       // "JP"
  countryName: string;       // "Japonya"
  flag: string;              // "🇯🇵"
  latitude: number;
  longitude: number;
  earnedAt: string;
  postId: string;            // Damgayı kazandıran gönderi
  stampLevel: 1 | 2 | 3;    // 1: İlk tarif, 2: 5 tarif, 3: 10+ tarif
};

type LezzettePasaportu = {
  userId: string;
  stamps: CuisineStamp[];
  totalCuisines: number;
  totalRecipes: number;
  passportLevel: PassportLevel;
  lastStampAt: string;
  shareableCardUrl?: string;  // Önbelleğe alınmış paylaşım kartı
};

type PassportLevel =
  | 'bronze'    // 1-5 mutfak
  | 'silver'    // 6-15 mutfak
  | 'gold'      // 16-30 mutfak
  | 'platinum'; // 31+ mutfak

// Desteklenen mutfaklar kataloğu
type CuisineCatalog = {
  id: string;
  name: string;
  countryCode: string;
  flag: string;
  latitude: number;
  longitude: number;
  representativeDishes: string[];  // ["Sushi", "Ramen", "Tempura"]
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
};
```

---

## 5.3 Firebase Veri Yapısı

```
Firestore Collections:

/cuisine_catalog/{cuisineId}              ← Mutfak kataloğu (sabit veri)
/users/{userId}/passport                  ← Kullanıcı pasaportu
/users/{userId}/passport/stamps/{id}     ← Bireysel damgalar
```

---

## 5.4 Cloud Function — Damga Kazanma

```typescript
export const onPostCreated = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    const db = admin.firestore();

    if (!post.cuisineId) return; // Mutfak etiketi yoksa atla

    const passportRef = db.doc(`users/${post.userId}/passport`);
    const passportSnap = await passportRef.get();
    const passport = passportSnap.data() as LezzettePasaportu | undefined;

    // Bu mutfaktan daha önce damga var mı?
    const existingStamp = passport?.stamps?.find(
      s => s.cuisineId === post.cuisineId
    );

    const cuisine = await db.doc(`cuisine_catalog/${post.cuisineId}`).get();
    const cuisineData = cuisine.data() as CuisineCatalog;

    if (!existingStamp) {
      // Yeni damga! İlk kez bu mutfaktan tarif
      const newStamp: CuisineStamp = {
        cuisineId: post.cuisineId,
        cuisineName: cuisineData.name,
        countryCode: cuisineData.countryCode,
        countryName: cuisineData.name,
        flag: cuisineData.flag,
        latitude: cuisineData.latitude,
        longitude: cuisineData.longitude,
        earnedAt: new Date().toISOString(),
        postId: context.params.postId,
        stampLevel: 1,
      };

      await passportRef.set({
        stamps: admin.firestore.FieldValue.arrayUnion(newStamp),
        totalCuisines: admin.firestore.FieldValue.increment(1),
        totalRecipes: admin.firestore.FieldValue.increment(1),
        lastStampAt: new Date().toISOString(),
      }, { merge: true });

      // XP ver
      await db.doc(`users/${post.userId}`).update({
        xp: admin.firestore.FieldValue.increment(cuisineData.xpReward),
      });

      // Bildirim gönder
      await db.collection('notifications').add({
        recipientId: post.userId,
        type: 'passport_stamp',
        title: `${cuisineData.flag} Yeni Damga: ${cuisineData.name}!`,
        body: `Pasaportunuza yeni bir ülke eklendi`,
        metadata: { cuisineId: post.cuisineId, stampLevel: 1 },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Milestone kontrol (5, 10, 20, 30 mutfak)
      const newTotal = (passport?.totalCuisines ?? 0) + 1;
      if ([5, 10, 20, 30].includes(newTotal)) {
        await awardPassportMilestone(post.userId, newTotal, db);
      }
    } else {
      // Mevcut damgayı güncelle (seviye atlama)
      const recipeCount = await countRecipesForCuisine(post.userId, post.cuisineId, db);
      const newLevel = recipeCount >= 10 ? 3 : recipeCount >= 5 ? 2 : 1;

      if (newLevel > existingStamp.stampLevel) {
        // Damga seviye atladı
        await passportRef.update({
          [`stamps`]: passport!.stamps.map(s =>
            s.cuisineId === post.cuisineId ? { ...s, stampLevel: newLevel } : s
          ),
        });
      }

      await passportRef.update({
        totalRecipes: admin.firestore.FieldValue.increment(1),
      });
    }
  });
```

---

## 5.5 React Native Hook'ları

```typescript
const useLezzetPasaportu = () => {
  const { user } = useAuthStore();

  const { data: passport } = useQuery({
    queryKey: ['passport', user?.uid],
    queryFn: () => getDoc(doc(db, 'users', user!.uid, 'passport'))
      .then(d => d.data() as LezzettePasaportu),
  });

  // Keşfedilmemiş mutfaklar
  const { data: undiscoveredCuisines } = useQuery({
    queryKey: ['undiscoveredCuisines', user?.uid],
    queryFn: async () => {
      const allCuisines = await getDocs(collection(db, 'cuisine_catalog'));
      const earnedIds = passport?.stamps.map(s => s.cuisineId) ?? [];
      return allCuisines.docs
        .map(d => d.data() as CuisineCatalog)
        .filter(c => !earnedIds.includes(c.id));
    },
    enabled: !!passport,
  });

  // Paylaşım kartı oluştur
  const generateShareCard = async (): Promise<string> => {
    // react-native-view-shot ile pasaport kartını capture et
    // Firebase Storage'a yükle
    // URL döndür
    return shareableUrl;
  };

  return { passport, undiscoveredCuisines, generateShareCard };
};
```

---

## 5.6 UI Akışı

```
Pasaport Ekranı:
┌─────────────────────────────────────┐
│  🗺️ Lezzet Pasaportum              │
│  🥈 Gümüş Pasaport · 12 Mutfak    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   [İnteraktif Dünya Haritası│   │  ← react-native-maps
│  │   Keşfedilen ülkeler        │   │    veya SVG haritası
│  │   saffron rengiyle dolu,    │   │
│  │   diğerleri gri]            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Damgalarım:                        │
│  🇹🇷🇯🇵🇮🇹🇲🇽🇮🇳🇫🇷🇹🇭🇬🇷🇱🇧🇲🇦🇨🇳🇪🇸   │
│                                     │
│  Sıradaki Hedef:                    │
│  🇰🇷 Kore Mutfağı — 3 tarif gerekli │
│                                     │
│  [Pasaportumu Paylaş]              │
└─────────────────────────────────────┘
```

---
---

# BÖLÜM 6 — 👨‍👩‍👧 Aile Tarif Arşivi

## 6.1 Konsept

Kullanıcılar aile üyeleriyle özel bir grup kuruyor, tarifleri sadece bu grupla paylaşıyor.
Büyükannenin tarifleri dijitalleşiyor, nesiller arası aktarım platformda yaşıyor.
Duygusal bağ en güçlü retention mekanizmasıdır — insanlar aile arşivinin olduğu uygulamayı silmez.

---

## 6.2 Veri Modeli

```typescript
type FamilyArchive = {
  id: string;
  name: string;             // "Yılmaz Ailesi Tarifleri"
  description?: string;
  coverImageUrl?: string;
  createdBy: string;        // Arşivi kuran kullanıcı
  members: ArchiveMember[];
  totalRecipes: number;
  isPrivate: boolean;       // Her zaman true (sadece aile)
  familyOrigin?: string;    // "Ege", "Karadeniz", "Rumeli" vb.
  createdAt: string;
};

type ArchiveMember = {
  userId: string;
  displayName: string;      // "Büyükannem Fatma"
  role: 'owner' | 'editor' | 'viewer';
  relation: FamilyRelation;
  joinedAt: string;
  contributedRecipes: number;
};

type FamilyRelation =
  | 'grandparent' | 'parent' | 'sibling'
  | 'child' | 'spouse' | 'relative' | 'other';

type FamilyRecipe = {
  id: string;
  archiveId: string;
  postId: string;           // Ana post ile bağlantı
  addedBy: string;
  recipeOrigin: string;     // "Büyükannem Fatma'nın tarifi"
  generation: number;       // Kaçıncı kuşaktan: 1 = dede/büyükanne
  story?: string;           // "Bu tarifi büyükannem anneannesinden öğrendi..."
  occasions: string[];      // ["Bayram", "Düğün", "Ramazan"]
  isSecretRecipe: boolean;  // Sadece aile görebilir
  inheritedFrom?: string;   // userId — kimden miras alındı
  createdAt: string;
};
```

---

## 6.3 Firebase Veri Yapısı

```
Firestore Collections:

/family_archives/{archiveId}                    ← Arşiv meta verisi
/family_archives/{archiveId}/recipes/{recipeId} ← Arşive özel tarifler
/family_archives/{archiveId}/members/{userId}   ← Üye kayıtları
/family_invitations/{inviteId}                  ← Davet linkleri

Firebase Security Rules — Aile arşivleri özel:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /family_archives/{archiveId}/{document=**} {
      allow read, write: if request.auth.uid in
        get(/databases/$(database)/documents/family_archives/$(archiveId))
          .data.members.keys();
    }
  }
}
```

---

## 6.4 Cloud Functions

```typescript
// Davet linki ile aileye katıl
export const joinFamilyArchive = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', '');

    const { inviteToken } = data;
    const db = admin.firestore();

    const inviteSnap = await db.collection('family_invitations')
      .where('token', '==', inviteToken)
      .where('expiresAt', '>', new Date().toISOString())
      .limit(1)
      .get();

    if (inviteSnap.empty) {
      throw new functions.https.HttpsError('not-found', 'Geçersiz veya süresi dolmuş davet');
    }

    const invite = inviteSnap.docs[0].data();
    const archiveId = invite.archiveId;

    // Üye olarak ekle
    await db.doc(`family_archives/${archiveId}/members/${context.auth.uid}`).set({
      userId: context.auth.uid,
      role: 'viewer',
      relation: 'relative',
      joinedAt: new Date().toISOString(),
      contributedRecipes: 0,
    });

    // Arşiv sahibine bildirim
    await db.collection('notifications').add({
      recipientId: invite.createdBy,
      senderId: context.auth.uid,
      type: 'family_member_joined',
      title: 'Aile Arşivine Yeni Üye!',
      body: 'Birileri aile arşivinize katıldı',
      metadata: { archiveId },
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { archiveId, success: true };
  }
);

// Aile tarifi eklenince üyelere bildirim
export const onFamilyRecipeAdded = functions.firestore
  .document('family_archives/{archiveId}/recipes/{recipeId}')
  .onCreate(async (snap, context) => {
    const recipe = snap.data() as FamilyRecipe;
    const { archiveId } = context.params;
    const db = admin.firestore();

    // Tüm aile üyelerini getir
    const membersSnap = await db
      .collection(`family_archives/${archiveId}/members`)
      .get();

    const adder = await db.doc(`users/${recipe.addedBy}`).get();

    // Her üyeye bildirim gönder (ekleyen hariç)
    const notifications = membersSnap.docs
      .filter(d => d.id !== recipe.addedBy)
      .map(d => db.collection('notifications').add({
        recipientId: d.id,
        senderId: recipe.addedBy,
        type: 'family_recipe_added',
        title: 'Aile Arşivine Yeni Tarif! 👨‍👩‍👧',
        body: `${adder.data()?.displayName} yeni bir tarif ekledi: "${recipe.recipeOrigin}"`,
        metadata: { archiveId, recipeId: snap.id },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }));

    await Promise.all(notifications);

    // XP ver
    await db.doc(`users/${recipe.addedBy}`).update({
      xp: admin.firestore.FieldValue.increment(35),
    });
  });
```

---

## 6.5 React Native Hook'ları

```typescript
// Aile arşivi yönetimi
const useFamilyArchive = (archiveId: string) => {
  const { user } = useAuthStore();

  const { data: archive } = useQuery({
    queryKey: ['familyArchive', archiveId],
    queryFn: () => getDoc(doc(db, 'family_archives', archiveId))
      .then(d => ({ id: d.id, ...d.data() } as FamilyArchive)),
  });

  const { data: recipes } = useQuery({
    queryKey: ['familyRecipes', archiveId],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'family_archives', archiveId, 'recipes'),
          orderBy('createdAt', 'desc')
        )
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyRecipe));
    },
  });

  // Tarifi arşive ekle
  const addToArchive = async (
    postId: string,
    origin: string,
    story: string,
    generation: number,
    occasions: string[]
  ) => {
    await addDoc(
      collection(db, 'family_archives', archiveId, 'recipes'),
      {
        archiveId, postId,
        addedBy: user!.uid,
        recipeOrigin: origin,
        story, generation, occasions,
        isSecretRecipe: false,
        createdAt: serverTimestamp(),
      }
    );
  };

  // Davet linki oluştur
  const generateInviteLink = async (): Promise<string> => {
    const token = generateSecureToken();
    await addDoc(collection(db, 'family_invitations'), {
      archiveId,
      createdBy: user!.uid,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün
      createdAt: serverTimestamp(),
    });
    return `neyesem://aile/${token}`;
  };

  return { archive, recipes, addToArchive, generateInviteLink };
};

// Kullanıcının tüm aile arşivleri
const useMyFamilyArchives = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['myArchives', user?.uid],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collectionGroup(db, 'members'),
          where('userId', '==', user!.uid)
        )
      );
      const archiveIds = snap.docs.map(d => d.ref.parent.parent!.id);
      const archives = await Promise.all(
        archiveIds.map(id => getDoc(doc(db, 'family_archives', id)))
      );
      return archives.map(d => ({ id: d.id, ...d.data() } as FamilyArchive));
    },
  });
};
```

---

## 6.6 UI Akışı

```
Aile Arşivi Ana Sayfa:
┌─────────────────────────────────────┐
│  👨‍👩‍👧 Yılmaz Ailesi Tarifleri        │
│  Ege kökenli · 47 tarif · 8 üye    │
│                                     │
│  [+ Tarif Ekle]  [Üye Davet Et]    │
│                                     │
│  📌 Öne Çıkanlar:                   │
│  ┌──────────────────────────────┐  │
│  │ 🥧 Büyükannem Fatma'nın      │  │
│  │    Zeytinyağlı Enginarı      │  │
│  │ "Bu tarifi 1960'lardan beri  │  │
│  │  yaparız, bayramın olmazsa   │  │
│  │  olmazı." — 3. kuşak        │  │
│  └──────────────────────────────┘  │
│                                     │
│  Üyeler:                           │
│  👵 Büyükannem  👴 Büyükbabam      │
│  👩 Annem       👨 Babam  + 4      │
└─────────────────────────────────────┘

Tarif Ekleme:
┌─────────────────────────────────────┐
│  Arşive Ekle                        │
│                                     │
│  Bu tarif: [Büyükannem Fatma'nın]  │
│  Kaçıncı kuşak: [1. Kuşak ▼]       │
│  Hikaye: "Bu tarifi anneannem..."   │
│  Özel günler: [Bayram] [Ramazan]   │
│                                     │
│  [Arşive Ekle]                     │
└─────────────────────────────────────┘
```

---
---

# BÖLÜM 7 — 🔄 Modüller Arası Entegrasyon Haritası

## 7.1 Tam Entegrasyon Matrisi

```
Malzeme DNA'sı
  ├── Mevsim Takvimi ile: Taranan malzeme mevsimindeyse +5 XP bonus
  ├── Haftalık Görev ile: "Bu malzemelerle bu haftanın görevini yap" önerisi
  ├── Tarif Zinciri ile: Eşleşen tarif bir zincirin parçasıysa zincire katıl önerisi
  └── Usta-Çırak ile: Çırak malzeme taradığında usta'ya bildirim

Usta-Çırak Sistemi
  ├── Pişirme Maratonu ile: Usta canlı ders verebilir, çıraklar öncelikli izler
  ├── Haftalık Görev ile: Usta ve çırak aynı görevi beraber tamamlarsa 2x XP
  ├── Lezzet Pasaportu ile: Usta farklı mutfaktan tarif öğretince pasaporta damga
  └── Aile Arşivi ile: Aile büyükleri genç üyelere usta olabilir

Mevsim Takvimi
  ├── Haftalık Görev ile: Haftalık görev mevsim malzemesine göre belirlenir
  ├── Malzeme DNA'sı ile: Mevsim malzemeleri tarama sonuçlarında öne çıkar
  └── Lezzet Pasaportu ile: Mevsimsel yemek yapınca pasaport XP bonusu

Pişirme Maratonu
  ├── Tarif Zinciri ile: Yayın sonrası oluşan tarif otomatik zincir başlatır
  ├── Usta-Çırak ile: Usta dersleri özel yayın formatında sunulur
  └── Lezzet Pasaportu ile: Yabancı mutfak yayını = otomatik pasaport damgası

Lezzet Pasaportu
  ├── Malzeme DNA'sı ile: Yeni mutfak malzemesi tarayınca keşif puanı
  ├── Haftalık Görev ile: "Bu hafta Kore damgası için Kore tarifi yap" görevi
  └── Aile Arşivi ile: Aile kökenli mutfak tarifleri pasaportta özel işaret alır

Aile Tarif Arşivi
  ├── Tarif Zinciri ile: Aile tarifi zincir başlangıcı olabilir
  ├── Usta-Çırak ile: Aile büyükleri genç üyeye usta olabilir
  └── Lezzet Pasaportu ile: Ailenin köken mutfağı pasaportta özel damga
```

## 7.2 Tüm Modüller — XP Tablosu

```typescript
const ALL_MODULES_XP = {
  // Malzeme DNA'sı
  ingredient_scan:              10,
  scan_seasonal_bonus:           5,  // Mevsim malzemesi tarandı
  pantry_recipe_made:           20,  // Tarama önerisiyle tarif yapıldı

  // Usta-Çırak
  mentor_application_sent:       5,
  mentor_application_accepted:  20,
  mentor_feedback_given:        15,
  mentor_feedback_received:     10,
  apprentice_level_up:          25,  // Çırak seviye atladı (ustaya da)
  mentorship_graduated:        100,  // Mezuniyet

  // Mevsim Takvimi
  seasonal_recipe_made:         15,  // Mevsim malzemesiyle tarif
  seasonal_peak_recipe:         25,  // Zirve döneminde mevsim tarifi

  // Pişirme Maratonu
  stream_started:               20,
  stream_viewer:                 5,  // Yayın izlemek
  stream_question_answered:     10,
  stream_recipe_generated:      40,  // Yayından tarif oluşturuldu

  // Lezzet Pasaportu
  new_cuisine_stamp:            30,  // Yeni ülke damgası
  stamp_level_2:                20,  // Damga seviye 2 (5 tarif)
  stamp_level_3:                30,  // Damga seviye 3 (10 tarif)
  passport_milestone_5:         50,
  passport_milestone_10:        75,
  passport_milestone_20:       100,

  // Aile Arşivi
  archive_created:              40,
  family_recipe_added:          35,
  family_member_invited:        15,
  family_member_joined:         20,
  heritage_recipe_added:        50,  // Kuşaktan gelen tarif
};
```

## 7.3 Tüm Yeni Bildirim Türleri

```typescript
type AllNotificationTypes =
  // Malzeme DNA'sı
  | 'scan_completed'          // Tarama tamamlandı
  | 'scan_recipe_match'       // Buzdolabınla yapılabilecek tarif var

  // Usta-Çırak
  | 'mentorship_request'      // Çırak başvurusu geldi
  | 'mentorship_accepted'     // Başvuru kabul edildi
  | 'mentorship_started'      // Yeni çırak hazır
  | 'mentor_feedback'         // Geri bildirim alındı
  | 'mentorship_graduated'    // Mezuniyet

  // Mevsim Takvimi
  | 'seasonal_ingredient_new' // Yeni mevsim malzemesi başladı
  | 'seasonal_expiring'       // Malzeme mevsimi bitiyor

  // Pişirme Maratonu
  | 'stream_started'          // Takip ettiğin biri yayına girdi
  | 'stream_recipe_ready'     // Yayın tarife dönüştürüldü
  | 'stream_mentor_class'     // Usta dersi başladı

  // Lezzet Pasaportu
  | 'passport_stamp'          // Yeni damga kazanıldı
  | 'passport_milestone'      // Pasaport milestone
  | 'passport_level_up'       // Pasaport seviye atladı

  // Aile Arşivi
  | 'family_recipe_added'     // Arşive tarif eklendi
  | 'family_member_joined'    // Aileye üye katıldı
  | 'family_invite_received'; // Davet linki alındı
```

---

# BÖLÜM 8 — 📦 Kurulum & Bağımlılıklar

## 8.1 Yeni Firebase Servisleri

```bash
# Görüntü analizi için Google Cloud Vision
npm install @google-cloud/vision

# AI tarif üretimi için OpenAI
npm install openai

# Canlı yayın için Agora
npm install react-native-agora

# Firebase Realtime Database (canlı yayın chat'i için)
npm install @react-native-firebase/database
```

## 8.2 Yeni React Native Paketleri

```bash
# İnteraktif harita (Lezzet Pasaportu)
npx expo install react-native-maps

# SVG haritası alternatifi
npm install react-native-svg

# Kamera (Malzeme DNA'sı tarama)
npx expo install expo-camera expo-image-picker

# Paylaşım kartları
npm install react-native-view-shot

# Deep link (Aile Arşivi davet)
npx expo install expo-linking

# Bildirimler
npx expo install expo-notifications
```

## 8.3 Firestore Güvenlik Kuralları — Tüm Yeni Koleksiyonlar

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Malzeme taramaları — sadece kendi
    match /ingredient_scans/{scanId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    // Mutfak kataloğu — herkes okuyabilir
    match /cuisine_catalog/{id} {
      allow read: if request.auth != null;
    }

    // Mevsim içeriği — herkes okuyabilir
    match /seasonal_ingredients/{id} {
      allow read: if request.auth != null;
    }
    match /seasonal_content/{id} {
      allow read: if request.auth != null;
    }

    // Usta-çırak ilişkileri
    match /mentorships/{mentorshipId} {
      allow read: if request.auth.uid == resource.data.mentorId
                  || request.auth.uid == resource.data.apprenticeId;
      allow create: if request.auth.uid == request.resource.data.apprenticeId;
      allow update: if request.auth.uid == resource.data.mentorId
                    || request.auth.uid == resource.data.apprenticeId;

      match /feedbacks/{feedbackId} {
        allow read: if request.auth.uid == resource.data.mentorId
                    || request.auth.uid == resource.data.apprenticeId;
        allow create: if request.auth.uid == resource.data.mentorId;
      }
    }

    // Canlı yayınlar
    match /live_streams/{streamId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.hostId;
      allow update: if request.auth.uid == resource.data.hostId;
    }

    // Aile arşivleri — sadece üyeler
    match /family_archives/{archiveId} {
      allow read, write: if exists(
        /databases/$(database)/documents/family_archives/$(archiveId)/members/$(request.auth.uid)
      );
      allow create: if request.auth.uid == request.resource.data.createdBy;

      match /recipes/{recipeId} {
        allow read, write: if exists(
          /databases/$(database)/documents/family_archives/$(archiveId)/members/$(request.auth.uid)
        );
      }

      match /members/{memberId} {
        allow read: if exists(
          /databases/$(database)/documents/family_archives/$(archiveId)/members/$(request.auth.uid)
        );
      }
    }

    // Pasaport — sadece kendisi
    match /users/{userId}/passport {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## 8.4 Geliştirme Öncelikleri

| # | Modül | Görev | Öncelik |
|---|-------|-------|---------|
| 1 | Malzeme DNA'sı | expo-camera entegrasyonu + Firebase Storage yükleme | Kritik |
| 2 | Malzeme DNA'sı | Cloud Vision API Cloud Function | Kritik |
| 3 | Aile Arşivi | Arşiv oluşturma + davet sistemi | Kritik |
| 4 | Lezzet Pasaportu | Mutfak kataloğu seed verisi | Kritik |
| 5 | Lezzet Pasaportu | Damga kazanma Cloud Function | Yüksek |
| 6 | Lezzet Pasaportu | İnteraktif harita UI | Yüksek |
| 7 | Usta-Çırak | Başvuru + onay akışı | Yüksek |
| 8 | Usta-Çırak | Geri bildirim sistemi | Yüksek |
| 9 | Mevsim Takvimi | Seed verisi + haftalık Cloud Function | Orta |
| 10 | Pişirme Maratonu | Agora entegrasyonu | Orta |
| 11 | Pişirme Maratonu | Whisper + GPT-4 tarif üretimi | Orta |
| 12 | Entegrasyon | Cross-modül XP tablosu | Son |

---

*Döküman versiyonu: 1.0 | Son güncelleme: Şubat 2026*
*Modüller: Malzeme DNA'sı · Usta-Çırak · Mevsim Takvimi · Pişirme Maratonu · Lezzet Pasaportu · Aile Tarif Arşivi*
