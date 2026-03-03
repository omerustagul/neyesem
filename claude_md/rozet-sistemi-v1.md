# 🏅 Rozet Sistemi — Neyesem Uygulaması
## 20 Rozet · Koşullar · Başlıklar · Firebase Altyapısı

> **Bu döküman bir AI kod editörü için hazırlanmıştır.**
> Rozet sistemi, kullanıcı aksiyonlarını dinleyen Cloud Function'lar ile çalışır.
> Her rozet bir kez kazanılır, tekrar kazanılamaz. Profil sayfasında sergilenir.

---

## 📋 Rozet Kataloğu

### GRUP 1 — Başlangıç Rozetleri
*Platforma ilk adımı atan kullanıcılar için*

| ID | Emoji | İsim | Başlık | Koşul |
|----|-------|------|--------|-------|
| `ilk_yorum` | 🗣️ | **Söz Vermiş** | *"Susması beklenirdi"* | İlk yorumu yaptı |
| `ilk_gonderi` | 📸 | **Sofra Kurdu** | *"Yemek soğumadan fotoğraflanır"* | İlk gönderiyi paylaştı |
| `ilk_begeni` | ❤️ | **Kalp Açık** | *"Sevmekten ödü kopar değil"* | İlk beğeniyi yaptı |
| `ilk_kayit` | 🔖 | **Depo Dolu** | *"Yapacaklar listesi büyüyor"* | İlk tarifi kaydetti |
| `profil_tamam` | 👤 | **Kapı Açıldı** | *"Artık yüzü var"* | Profili %100 tamamladı |

---

### GRUP 2 — Yemek Kültürü Rozetleri
*Yemek tutkusunu eylemlere döken kullanıcılar için*

| ID | Emoji | İsim | Başlık | Koşul |
|----|-------|------|--------|-------|
| `damak_atesi` | 🌶️ | **Damak Ateşi** | *"Yanıyor ama devam ediyor"* | Acı meydan okuma modunda 5 tarif yaptı |
| `lezzet_gezgini` | 🌍 | **Lezzet Gezgini** | *"Pasaportu tariflerle dolu"* | 5 farklı ülke mutfağından tarif paylaştı |
| `dede_ocagi` | 👵 | **Dede Ocağı** | *"Büyükannenin sırrını taşıyor"* | Aile tarif arşivine 10 tarif ekledi |
| `gece_kusu` | 🕛 | **Gece Kuşu** | *"Saat 01:00, yine mutfakta"* | Gece yarısı modunda 7 tarif yaptı |
| `zincir_ustasi` | 🔗 | **Zincir Ustası** | *"Bir tarif bin el dolaştı"* | Başlattığı tarif zinciri 10 halkaya ulaştı |

---

### GRUP 3 — Sosyal Rozetler
*Topluluğu büyüten ve bağ kuran kullanıcılar için*

| ID | Emoji | İsim | Başlık | Koşul |
|----|-------|------|--------|-------|
| `mahalle_bakkali` | 🎙️ | **Mahalle Bakkalı** | *"Herkesin bir lafı var"* | Toplam 50 yorum yaptı |
| `el_uzatmis` | 🤝 | **El Uzatmış** | *"Sofra geniş tutulur"* | 20 kişiyi takip etti |
| `duyurdum_sana` | 📣 | **Duyurdum Sana** | *"Söyledim, oldu"* | Bir gönderisi 100 beğeni aldı |
| `cirak_mezun` | 🏅 | **Çırak Mezun Etti** | *"Ustanın izi tarifde kalır"* | Usta olarak 3 çırağını mezun etti |
| `trend_kiran` | 🔥 | **Trend Kıran** | *"Öyle bir şey yaptı ki..."* | Gönderisi keşfet sayfasına çıktı |

---

### GRUP 4 — Ustalık Rozetleri
*Tutarlılığını ve kararlılığını kanıtlayan kullanıcılar için*

| ID | Emoji | İsim | Başlık | Koşul |
|----|-------|------|--------|-------|
| `hiz_sefi` | ⚡ | **Hız Şefi** | *"Her gün bir tarif, hiç bahane yok"* | 30 gün içinde 30 tarif paylaştı |
| `devamlı_ates` | 📅 | **Devamlı Ateş** | *"Tutarlılık bir yetenektir"* | 7 hafta üst üste haftalık görevi tamamladı |
| `dolap_dedektifi` | 🧬 | **Dolap Dedektifi** | *"Buzdolabında hep bir şeyler bulur"* | Malzeme DNA'sını 15 kez kullandı |
| `yayinci_ruh` | 🎬 | **Yayıncı Ruh** | *"Kamera açık, ocak yanık"* | 5 canlı pişirme maratonu yaptı |
| `soframın_efendisi` | 👑 | **Sofranın Efendisi** | *"Bu unvan hak edilir, verilmez"* | Level 10'a ulaştı |

---

## 🗄️ Veri Modeli

```typescript
// src/types/badge.types.ts

export type BadgeId =
  | 'ilk_yorum'        | 'ilk_gonderi'      | 'ilk_begeni'
  | 'ilk_kayit'        | 'profil_tamam'     | 'damak_atesi'
  | 'lezzet_gezgini'   | 'dede_ocagi'       | 'gece_kusu'
  | 'zincir_ustasi'    | 'mahalle_bakkali'  | 'el_uzatmis'
  | 'duyurdum_sana'    | 'cirak_mezun'      | 'trend_kiran'
  | 'hiz_sefi'         | 'devamli_ates'     | 'dolap_dedektifi'
  | 'yayinci_ruh'      | 'soframın_efendisi';

export type BadgeGroup =
  | 'baslangic'
  | 'yemek_kulturu'
  | 'sosyal'
  | 'ustalik';

export type Badge = {
  id: BadgeId;
  emoji: string;
  name: string;
  title: string;         // Rozet başlığı — profilde italik gösterilir
  description: string;  // Koşul açıklaması
  group: BadgeGroup;
  xpReward: number;
  isSecret: boolean;    // true ise kazanılana kadar görünmez
};

export type UserBadge = {
  badgeId: BadgeId;
  earnedAt: string;     // ISO string
  postId?: string;      // Rozeti kazandıran gönderi (varsa)
};
```

---

## 📦 Rozet Kataloğu (Sabit Veri)

```typescript
// src/constants/badges.ts

import { Badge } from '../types/badge.types';

export const BADGES: Badge[] = [

  // ─── Başlangıç ───────────────────────────────────────
  {
    id: 'ilk_yorum',
    emoji: '🗣️',
    name: 'Söz Vermiş',
    title: '"Susması beklenirdi"',
    description: 'İlk yorumunu yaptın.',
    group: 'baslangic',
    xpReward: 20,
    isSecret: false,
  },
  {
    id: 'ilk_gonderi',
    emoji: '📸',
    name: 'Sofra Kurdu',
    title: '"Yemek soğumadan fotoğraflanır"',
    description: 'İlk gönderini paylaştın.',
    group: 'baslangic',
    xpReward: 30,
    isSecret: false,
  },
  {
    id: 'ilk_begeni',
    emoji: '❤️',
    name: 'Kalp Açık',
    title: '"Sevmekten ödü kopar değil"',
    description: 'İlk beğenini yaptın.',
    group: 'baslangic',
    xpReward: 10,
    isSecret: false,
  },
  {
    id: 'ilk_kayit',
    emoji: '🔖',
    name: 'Depo Dolu',
    title: '"Yapacaklar listesi büyüyor"',
    description: 'İlk tarifi kaydettın.',
    group: 'baslangic',
    xpReward: 15,
    isSecret: false,
  },
  {
    id: 'profil_tamam',
    emoji: '👤',
    name: 'Kapı Açıldı',
    title: '"Artık yüzü var"',
    description: 'Profilini %100 tamamladın.',
    group: 'baslangic',
    xpReward: 25,
    isSecret: false,
  },

  // ─── Yemek Kültürü ────────────────────────────────────
  {
    id: 'damak_atesi',
    emoji: '🌶️',
    name: 'Damak Ateşi',
    title: '"Yanıyor ama devam ediyor"',
    description: 'Acı meydan okuma modunda 5 tarif yaptın.',
    group: 'yemek_kulturu',
    xpReward: 50,
    isSecret: false,
  },
  {
    id: 'lezzet_gezgini',
    emoji: '🌍',
    name: 'Lezzet Gezgini',
    title: '"Pasaportu tariflerle dolu"',
    description: '5 farklı ülke mutfağından tarif paylaştın.',
    group: 'yemek_kulturu',
    xpReward: 60,
    isSecret: false,
  },
  {
    id: 'dede_ocagi',
    emoji: '👵',
    name: 'Dede Ocağı',
    title: '"Büyükannenin sırrını taşıyor"',
    description: 'Aile tarif arşivine 10 tarif ekledin.',
    group: 'yemek_kulturu',
    xpReward: 75,
    isSecret: false,
  },
  {
    id: 'gece_kusu',
    emoji: '🕛',
    name: 'Gece Kuşu',
    title: '"Saat 01:00, yine mutfakta"',
    description: 'Gece yarısı modunda 7 tarif yaptın.',
    group: 'yemek_kulturu',
    xpReward: 45,
    isSecret: true,   // Sürpriz rozet — kazanılana kadar görünmez
  },
  {
    id: 'zincir_ustasi',
    emoji: '🔗',
    name: 'Zincir Ustası',
    title: '"Bir tarif bin el dolaştı"',
    description: 'Başlattığın tarif zinciri 10 halkaya ulaştı.',
    group: 'yemek_kulturu',
    xpReward: 80,
    isSecret: false,
  },

  // ─── Sosyal ──────────────────────────────────────────
  {
    id: 'mahalle_bakkali',
    emoji: '🎙️',
    name: 'Mahalle Bakkalı',
    title: '"Herkesin bir lafı var"',
    description: 'Toplam 50 yorum yaptın.',
    group: 'sosyal',
    xpReward: 55,
    isSecret: false,
  },
  {
    id: 'el_uzatmis',
    emoji: '🤝',
    name: 'El Uzatmış',
    title: '"Sofra geniş tutulur"',
    description: '20 kişiyi takip ettin.',
    group: 'sosyal',
    xpReward: 30,
    isSecret: false,
  },
  {
    id: 'duyurdum_sana',
    emoji: '📣',
    name: 'Duyurdum Sana',
    title: '"Söyledim, oldu"',
    description: 'Bir gönderin 100 beğeni aldı.',
    group: 'sosyal',
    xpReward: 70,
    isSecret: false,
  },
  {
    id: 'cirak_mezun',
    emoji: '🏅',
    name: 'Çırak Mezun Etti',
    title: '"Ustanın izi tarifde kalır"',
    description: 'Usta olarak 3 çırağını mezun ettin.',
    group: 'sosyal',
    xpReward: 100,
    isSecret: false,
  },
  {
    id: 'trend_kiran',
    emoji: '🔥',
    name: 'Trend Kıran',
    title: '"Öyle bir şey yaptı ki..."',
    description: 'Bir gönderin keşfet sayfasına çıktı.',
    group: 'sosyal',
    xpReward: 90,
    isSecret: true,   // Sürpriz rozet
  },

  // ─── Ustalık ─────────────────────────────────────────
  {
    id: 'hiz_sefi',
    emoji: '⚡',
    name: 'Hız Şefi',
    title: '"Her gün bir tarif, hiç bahane yok"',
    description: '30 gün içinde 30 tarif paylaştın.',
    group: 'ustalik',
    xpReward: 120,
    isSecret: false,
  },
  {
    id: 'devamli_ates',
    emoji: '📅',
    name: 'Devamlı Ateş',
    title: '"Tutarlılık bir yetenektir"',
    description: '7 hafta üst üste haftalık görevi tamamladın.',
    group: 'ustalik',
    xpReward: 150,
    isSecret: false,
  },
  {
    id: 'dolap_dedektifi',
    emoji: '🧬',
    name: 'Dolap Dedektifi',
    title: '"Buzdolabında hep bir şeyler bulur"',
    description: 'Malzeme DNA\'sını 15 kez kullandın.',
    group: 'ustalik',
    xpReward: 65,
    isSecret: false,
  },
  {
    id: 'yayinci_ruh',
    emoji: '🎬',
    name: 'Yayıncı Ruh',
    title: '"Kamera açık, ocak yanık"',
    description: '5 canlı pişirme maratonu yaptın.',
    group: 'ustalik',
    xpReward: 85,
    isSecret: false,
  },
  {
    id: 'soframın_efendisi',
    emoji: '👑',
    name: 'Sofranın Efendisi',
    title: '"Bu unvan hak edilir, verilmez"',
    description: 'Level 10\'a ulaştın.',
    group: 'ustalik',
    xpReward: 200,
    isSecret: false,
  },
];

export const getBadgeById = (id: string): Badge | undefined =>
  BADGES.find(b => b.id === id);

export const getBadgesByGroup = (group: Badge['group']): Badge[] =>
  BADGES.filter(b => b.group === group);
```

---

## 🗄️ Firebase Veri Yapısı

```
Firestore Collections:

/users/{userId}/badges/{badgeId}       ← Kullanıcının kazandığı rozetler
/users/{userId}/badgeProgress/{badgeId} ← Süreç takibi (ör: 7/50 yorum)

Örnek /users/{userId}/badges/ilk_yorum dökümanı:
{
  badgeId: 'ilk_yorum',
  earnedAt: '2026-02-14T21:30:00.000Z',
  postId: 'abc123'   // varsa
}

Örnek /users/{userId}/badgeProgress/mahalle_bakkali dökümanı:
{
  badgeId: 'mahalle_bakkali',
  current: 12,
  target: 50,
  lastUpdated: '2026-02-14T21:30:00.000Z'
}
```

---

## ⚙️ Cloud Functions

```typescript
// functions/src/badgeEngine.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { BadgeId } from '../../src/types/badge.types';
import { BADGES } from '../../src/constants/badges';

const db = admin.firestore();

// ─── Rozet verme yardımcısı ───────────────────────────────
const awardBadge = async (
  userId: string,
  badgeId: BadgeId,
  postId?: string
) => {
  const badgeRef = db.doc(`users/${userId}/badges/${badgeId}`);
  const existing = await badgeRef.get();

  // Zaten kazanılmışsa tekrar verme
  if (existing.exists) return;

  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return;

  // Rozeti kaydet
  await badgeRef.set({
    badgeId,
    earnedAt: new Date().toISOString(),
    ...(postId ? { postId } : {}),
  });

  // XP ver
  await db.doc(`users/${userId}`).update({
    xp: admin.firestore.FieldValue.increment(badge.xpReward),
  });

  // Bildirim gönder
  await db.collection('notifications').add({
    recipientId: userId,
    type: 'badge_earned',
    title: `${badge.emoji} Yeni Rozet: ${badge.name}`,
    body: badge.title,
    metadata: { badgeId },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

// İlerleme sayacını artır ve hedefe ulaşıldıysa rozet ver
const incrementProgress = async (
  userId: string,
  badgeId: BadgeId,
  target: number,
  postId?: string
) => {
  const progressRef = db.doc(`users/${userId}/badgeProgress/${badgeId}`);
  const snap = await progressRef.get();
  const current = (snap.data()?.current ?? 0) + 1;

  await progressRef.set({ badgeId, current, target,
    lastUpdated: new Date().toISOString() }, { merge: true });

  if (current >= target) {
    await awardBadge(userId, badgeId, postId);
  }
};

// ─── Tetikleyiciler ───────────────────────────────────────

// Yorum yapıldığında
export const onCommentCreated = functions.firestore
  .document('comments/{commentId}')
  .onCreate(async (snap) => {
    const comment = snap.data();
    const userId = comment.userId;

    // İlk yorum rozeti
    const userComments = await db.collection('comments')
      .where('userId', '==', userId).limit(2).get();
    if (userComments.size === 1) {
      await awardBadge(userId, 'ilk_yorum');
    }

    // Mahalle Bakkalı — 50 yorum
    await incrementProgress(userId, 'mahalle_bakkali', 50);
  });

// Gönderi paylaşıldığında
export const onPostCreated = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();
    const userId = post.userId;
    const postId = context.params.postId;

    // İlk gönderi rozeti
    const userPosts = await db.collection('posts')
      .where('userId', '==', userId).limit(2).get();
    if (userPosts.size === 1) {
      await awardBadge(userId, 'ilk_gonderi', postId);
    }

    // Hız Şefi — 30 günde 30 gönderi
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPosts = await db.collection('posts')
      .where('userId', '==', userId)
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    if (recentPosts.size >= 30) {
      await awardBadge(userId, 'hiz_sefi', postId);
    }

    // Gece Kuşu — gece yarısı modu + saat kontrolü
    const hour = new Date().getHours();
    if ((hour >= 23 || hour <= 2) && post.moodTags?.moodScores?.gece_yarisi >= 0.5) {
      await incrementProgress(userId, 'gece_kusu', 7, postId);
    }

    // Damak Ateşi — acı meydan okuma
    if (post.moodTags?.moodScores?.aci_meydan_okuma >= 0.5) {
      await incrementProgress(userId, 'damak_atesi', 5, postId);
    }

    // Lezzet Gezgini — 5 farklı mutfak
    if (post.cuisineId) {
      const cuisinePosts = await db.collection('posts')
        .where('userId', '==', userId)
        .where('cuisineId', '!=', null)
        .get();
      const uniqueCuisines = new Set(cuisinePosts.docs.map(d => d.data().cuisineId));
      if (uniqueCuisines.size >= 5) {
        await awardBadge(userId, 'lezzet_gezgini', postId);
      }
    }
  });

// Beğeni yapıldığında
export const onLikeCreated = functions.firestore
  .document('likes/{likeId}')
  .onCreate(async (snap) => {
    const like = snap.data();

    // Beğenen kullanıcıya ilk beğeni rozeti
    const userLikes = await db.collection('likes')
      .where('userId', '==', like.userId).limit(2).get();
    if (userLikes.size === 1) {
      await awardBadge(like.userId, 'ilk_begeni');
    }

    // Gönderi sahibine Duyurdum Sana rozeti — 100 beğeni
    const postLikes = await db.collection('likes')
      .where('postId', '==', like.postId).get();
    if (postLikes.size >= 100) {
      const post = await db.doc(`posts/${like.postId}`).get();
      await awardBadge(post.data()!.userId, 'duyurdum_sana', like.postId);
    }
  });

// Kaydetme yapıldığında
export const onSaveCreated = functions.firestore
  .document('saves/{saveId}')
  .onCreate(async (snap) => {
    const save = snap.data();
    const userSaves = await db.collection('saves')
      .where('userId', '==', save.userId).limit(2).get();
    if (userSaves.size === 1) {
      await awardBadge(save.userId, 'ilk_kayit');
    }
  });

// Takip yapıldığında
export const onFollowCreated = functions.firestore
  .document('follows/{followId}')
  .onCreate(async (snap) => {
    const follow = snap.data();
    const userFollows = await db.collection('follows')
      .where('followerId', '==', follow.followerId).get();
    if (userFollows.size >= 20) {
      await awardBadge(follow.followerId, 'el_uzatmis');
    }
  });

// Profil güncellendiğinde
export const onProfileUpdated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();
    const userId = context.params.userId;

    const isComplete = !!(
      after.displayName &&
      after.avatarUrl &&
      after.bio &&
      after.location
    );

    if (isComplete) {
      await awardBadge(userId, 'profil_tamam');
    }
  });

// Kullanıcı level atladığında
export const onLevelUp = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    if (before.level < 10 && after.level >= 10) {
      await awardBadge(userId, 'soframın_efendisi');
    }
  });

// Tarif zinciri 10 halkaya ulaştığında
export const onChainMilestone = functions.firestore
  .document('chains/{chainId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.totalLinks < 10 && after.totalLinks >= 10) {
      await awardBadge(after.rootUserId, 'zincir_ustasi', after.rootPostId);
    }
  });

// Aile arşivine tarif eklendiğinde
export const onFamilyRecipeAdded = functions.firestore
  .document('family_archives/{archiveId}/recipes/{recipeId}')
  .onCreate(async (snap) => {
    const recipe = snap.data();
    await incrementProgress(recipe.addedBy, 'dede_ocagi', 10);
  });

// Malzeme taraması tamamlandığında
export const onIngredientScanCompleted = functions.firestore
  .document('ingredient_scans/{scanId}')
  .onUpdate(async (change) => {
    const after = change.after.data();
    if (after.status === 'completed') {
      await incrementProgress(after.userId, 'dolap_dedektifi', 15);
    }
  });

// Canlı yayın tamamlandığında
export const onStreamEnded = functions.firestore
  .document('live_streams/{streamId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== 'ended' && after.status === 'ended') {
      await incrementProgress(after.hostId, 'yayinci_ruh', 5);
    }
  });

// Haftalık görev tamamlandığında
export const onChallengeCompleted = functions.firestore
  .document('users/{userId}/challenges/{weekId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    if (before.status !== 'completed' && after.status === 'completed') {
      await incrementProgress(userId, 'devamli_ates', 7);
    }
  });

// Çırak mezun olduğunda
export const onMentorshipCompleted = functions.firestore
  .document('mentorships/{mentorshipId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== 'completed' && after.status === 'completed') {
      await incrementProgress(after.mentorId, 'cirak_mezun', 3);
    }
  });
```

---

## 🖥️ React Native Hook'ları

```typescript
// src/hooks/useBadges.ts

import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { BADGES } from '../constants/badges';
import { UserBadge } from '../types/badge.types';

// Kullanıcının kazandığı rozetleri getir
export const useUserBadges = (userId?: string) => {
  const { user } = useAuthStore();
  const targetId = userId ?? user?.uid;

  return useQuery({
    queryKey: ['badges', targetId],
    enabled: !!targetId,
    queryFn: async () => {
      const snap = await getDocs(
        collection(db, 'users', targetId!, 'badges')
      );
      return snap.docs.map(d => d.data() as UserBadge);
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Rozet ilerleme takibi
export const useBadgeProgress = (badgeId: string) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['badgeProgress', user?.uid, badgeId],
    enabled: !!user,
    queryFn: async () => {
      const snap = await getDoc(
        doc(db, 'users', user!.uid, 'badgeProgress', badgeId)
      );
      return snap.data() as { current: number; target: number } | undefined;
    },
  });
};

// Profil sayfası için rozet listesini hazırla
// Kazanılanlar önce, kazanılmayanlar gri + kilitli gösterilir
export const useProfileBadges = (userId?: string) => {
  const { data: userBadges = [] } = useUserBadges(userId);
  const { user } = useAuthStore();
  const isOwnProfile = !userId || userId === user?.uid;

  const earnedIds = new Set(userBadges.map(b => b.badgeId));

  return BADGES
    .filter(badge => {
      // Gizli rozetler kazanılmadan gösterilmez
      if (badge.isSecret && !earnedIds.has(badge.id)) return isOwnProfile ? false : false;
      return true;
    })
    .map(badge => ({
      ...badge,
      isEarned: earnedIds.has(badge.id),
      earnedAt: userBadges.find(b => b.badgeId === badge.id)?.earnedAt,
    }))
    .sort((a, b) => {
      // Kazanılanlar önce
      if (a.isEarned && !b.isEarned) return -1;
      if (!a.isEarned && b.isEarned) return 1;
      return 0;
    });
};
```

---

## 🎨 UI Bileşeni — Rozet Kartı

```tsx
// src/components/badges/BadgeCard.tsx

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withSequence, withTiming,
} from 'react-native-reanimated';
import { Badge } from '../../types/badge.types';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  badge: Badge & { isEarned: boolean; earnedAt?: string };
  onPress?: () => void;
  size?: 'small' | 'large';
};

export default function BadgeCard({ badge, onPress, size = 'large' }: Props) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 10 }),
      withSpring(1.0, { damping: 15 })
    );
    onPress?.();
  };

  const isSmall = size === 'small';

  return (
    <Animated.View style={[animStyle, isSmall ? styles.wrapperSmall : styles.wrapper]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          isSmall ? styles.cardSmall : styles.card,
          {
            backgroundColor: badge.isEarned
              ? theme.surface
              : theme.surfaceDim,
            borderColor: badge.isEarned
              ? 'rgba(244, 164, 24, 0.4)'
              : theme.border,
            opacity: badge.isEarned ? 1 : 0.45,
          },
        ]}
      >
        {/* Emoji */}
        <Text style={isSmall ? styles.emojiSmall : styles.emoji}>
          {badge.isEarned ? badge.emoji : '🔒'}
        </Text>

        {/* İsim */}
        <Text
          style={[
            isSmall ? styles.nameSmall : styles.name,
            { color: badge.isEarned ? theme.text : theme.textSecondary },
          ]}
          numberOfLines={1}
        >
          {badge.name}
        </Text>

        {/* Başlık — sadece büyük kartda */}
        {!isSmall && badge.isEarned && (
          <Text style={[styles.title, { color: 'rgba(244,164,24,0.8)' }]}>
            {badge.title}
          </Text>
        )}

        {/* Kazanılma tarihi */}
        {!isSmall && badge.earnedAt && (
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {new Date(badge.earnedAt).toLocaleDateString('tr-TR')}
          </Text>
        )}

        {/* Yeni rozet parlama efekti */}
        {badge.isEarned && (
          <View style={[styles.glowDot, { backgroundColor: '#F4A418' }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper:      { width: 160, marginRight: 12, marginBottom: 12 },
  wrapperSmall: { width: 80,  marginRight: 8,  marginBottom: 8  },
  card: {
    borderRadius: 20, padding: 16, borderWidth: 1,
    alignItems: 'center', minHeight: 140,
  },
  cardSmall: {
    borderRadius: 16, padding: 10, borderWidth: 1,
    alignItems: 'center', minHeight: 80,
  },
  emoji:      { fontSize: 36, marginBottom: 8  },
  emojiSmall: { fontSize: 24, marginBottom: 4  },
  name: {
    fontFamily: 'DMSans-Medium', fontSize: 13,
    fontWeight: '600', textAlign: 'center', marginBottom: 4,
  },
  nameSmall: {
    fontFamily: 'DMSans-Medium', fontSize: 10,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Fraunces-Regular', fontSize: 11,
    textAlign: 'center', fontStyle: 'italic', marginBottom: 6,
  },
  date: {
    fontFamily: 'DMSans-Regular', fontSize: 10, marginTop: 4,
  },
  glowDot: {
    position: 'absolute', top: 10, right: 10,
    width: 7, height: 7, borderRadius: 3.5,
  },
});
```

---

## ✅ Implementasyon Kontrol Listesi

- [ ] `src/types/badge.types.ts` oluştur
- [ ] `src/constants/badges.ts` oluştur (20 rozet)
- [ ] `functions/src/badgeEngine.ts` Cloud Functions oluştur
- [ ] `firebase deploy --only functions` ile deploy et
- [ ] `src/hooks/useBadges.ts` oluştur
- [ ] `src/components/badges/BadgeCard.tsx` oluştur
- [ ] Profil sayfasına rozet bölümü ekle (`useProfileBadges` hook'u ile)
- [ ] Rozet kazanılınca bildirim göster (notification listener'a `badge_earned` tipi ekle)
- [ ] Kazanılan rozet için konfeti/animasyon ekle (isteğe bağlı)

---

## ⚠️ Dikkat Edilecek Noktalar

1. `awardBadge` fonksiyonu başında `existing.exists` kontrolü var — aynı rozet iki kez verilmez.
2. `isSecret: true` olan rozetler (`gece_kusu`, `trend_kiran`) kazanılana kadar profilde görünmez.
3. `incrementProgress` ilerleme sayacını artırır; hedefe ulaşılınca otomatik `awardBadge` çağırır.
4. `onLevelUp` ve `onProfileUpdated` aynı `users/{userId}` dökümanını dinler — her ikisi de `onUpdate` trigger'ı kullanır, çakışma yoktur.
5. `trend_kiran` rozeti şu an manuel tetiklenir — keşfet algoritması oluşturulduğunda bu fonksiyona entegre edilmeli.

---

*Döküman versiyonu: 1.0 | Neyesem Uygulaması | Rozet Sistemi*
*20 rozet · 4 grup · Firebase Cloud Functions · React Native*
