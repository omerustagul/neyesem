# 🍽️ FoodSocial — React Native Sosyal Medya Uygulaması: Geliştirici Promptu

---

## 🎯 Proje Özeti

**FoodSocial**, yeme-içme odaklı, Instagram ve TikTok içeriklerini embed yöntemiyle bünyesinde sunan; kullanıcıların kendi gönderi, story ve listelerini paylaşabildiği, gamification (seviye & ödül sistemi) ile kullanıcı bağlılığı oluşturan modern bir mobil sosyal medya uygulamasıdır. Platform **React Native (Expo)** ile geliştirilecek, backend olarak **Supabase** (PostgreSQL + Auth + Storage + Realtime) kullanılacaktır.

---

## 🧱 Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Mobil Framework | React Native (Expo SDK 51+) |
| Navigasyon | React Navigation v6 (Bottom Tab + Stack + Modal) |
| Backend & Auth | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| State Yönetimi | Zustand |
| UI Kütüphanesi | Custom Glass Component Library (aşağıda tanımlı) |
| Animasyon | React Native Reanimated 3 + Moti |
| Embed | react-native-webview (Instagram oEmbed, TikTok oEmbed) |
| Bildirim | Expo Notifications + Supabase Realtime |
| Tema | React Native Paper + Custom Theme Provider (light/dark) |
| Görsel Depolama | Supabase Storage (avatarlar, gönderi medyası) |

---

## 🎨 Tasarım Sistemi

### Renk Paleti — "Açlık Tonları"

```js
const colors = {
  // Ana renkler — sıcak, yemek çağrıştıran
  saffron:       '#F4A418', // safran sarısı (primary)
  terracotta:    '#C0513A', // toprak kırmızısı (accent)
  cream:         '#FAF3E0', // krem (light background)
  charcoalGrill: '#1C1C1E', // mangal siyahı (dark background)
  oliveDark:     '#3B4A2F', // koyu zeytin (secondary text dark)
  oliveLight:    '#8FA67A', // açık zeytin (secondary text light)
  warmWhite:     '#FFFDF7', // warm white (card bg light)
  spiceRed:      '#E03E2D', // acı biber kırmızısı (destructive)
  mintFresh:     '#4CAF82', // nane yeşili (success)

  // Glass efektler
  glassLight:    'rgba(255,253,247,0.72)',
  glassDark:     'rgba(28,28,30,0.72)',
  glassBorder:   'rgba(244,164,24,0.25)',
};
```

### Glass Morphism Bileşen Kuralları

Tüm kartlar, modallar ve navbar şu kurallara uymalıdır:

- `borderRadius`: Minimum 20px, kartlarda 24px, bottom sheet'lerde 32px
- `backdropFilter: blur(20px)` — `@react-native-community/blur` (BlurView) ile uygulanır
- `background`: Temaya göre `glassLight` veya `glassDark`
- `border`: 1px solid `glassBorder`
- `shadow`: `shadowColor: saffron`, `shadowOpacity: 0.15`, `elevation: 8`
- Aktif / pressed state'lerde hafif `saffron` glow efekti (Reanimated ile)

### Tipografi

```js
const typography = {
  displayFont:  'Playfair Display',   // Başlıklar, level isimleri
  bodyFont:     'DM Sans',            // Genel metin
  accentFont:   'Fraunces',           // Özel vurgular, rozet etiketleri
  monoFont:     'JetBrains Mono',     // Puan / sayaçlar
};
```

---

## 🗂️ Uygulama Mimarisi

### Dizin Yapısı

```
/src
  /api            → Supabase query fonksiyonları (modüler)
  /components
    /glass        → GlassCard, GlassButton, GlassInput, GlassSheet
    /social       → LikeButton, FollowButton, SaveButton, CommentButton, ShareButton
    /feed         → PostCard, StoryRing, EmbedCard (Instagram/TikTok)
    /level        → LevelBadge, XPBar, RewardModal, LevelUpSheet
    /notification → NotificationItem, NotificationList
  /screens
    /feed         → FeedScreen
    /explore      → ExploreScreen
    /lists        → ListsScreen
    /profile      → ProfileScreen, EditProfileScreen
    /create       → CreateScreen, CreatePostScreen, CreateStoryScreen
    /notification → NotificationScreen
    /auth         → LoginScreen, RegisterScreen, OnboardingScreen
  /navigation     → RootNavigator, TabNavigator, StackNavigators
  /store          → authStore, feedStore, notificationStore, levelStore
  /hooks          → useFollow, useLike, useSave, useComment, useEmbed, useLevel
  /theme          → ThemeProvider, useTheme, lightTheme, darkTheme
  /utils          → embedParser, xpCalculator, dateFormatter
```

---

## 🧭 Navigasyon

### Floating Bottom Navbar

- Ekranın altında, zeminden 16px yüksekte, `GlassCard` stilinde yüzer bir tab bar
- `borderRadius: 32px`, `BlurView` arka plan, `glassBorder` çerçeve
- Seçili tab item saffron rengiyle highlight edilir, Reanimated ile spring animasyonu
- Tab ikonları: Lucide React Native seti

**Tab Sırası:**

| İkon | Etiket | Ekran |
|---|---|---|
| `Home` | Akış | FeedScreen |
| `Compass` | Keşfet | ExploreScreen |
| `PlusCircle` (büyük, saffron) | **Oluştur** | CreateScreen (Modal) |
| `BookMarked` | Listeler | ListsScreen |
| `User` | Profil | ProfileScreen |

**Oluştur Butonu:**
- Diğer ikonlardan %30 büyük, saffron gradyan dolgu, gölge efekti
- Basıldığında bottom sheet açılır: "Gönderi Oluştur" ve "Story Oluştur" seçenekleri (seviye kısıtlamasına göre aktif/pasif)
- Kilitli seçenekler gri + kilit ikonu ile gösterilir, tıklanınca "Bu özellik için Level 2 gerekli" uyarısı çıkar

---

## 🔔 Bildirim Sistemi

### Bildirim Türleri

```typescript
type NotificationType =
  | 'like'           // Gönderini beğendi
  | 'comment'        // Yorum yaptı
  | 'follow'         // Seni takip etmeye başladı
  | 'follow_request' // Takip isteği gönderdi
  | 'save'           // Gönderini kaydetti
  | 'mention'        // Senden bahsetti
  | 'level_up'       // Seviye atladın! (sistem)
  | 'reward'         // Ödül kazandın (sistem)
  | 'xp_gained'      // XP kazandın (sistem)
  | 'system';        // Genel sistem bildirimi
```

### Bildirim Ekranı

- Navbar sağ üstünde çan ikonu — okunmamış bildirim sayısı için kırmızı badge
- Tıklanınca `NotificationScreen` stack push edilir (Instagram mantığı)
- Bildirimler: "Bugün", "Bu Hafta", "Daha Önce" gruplarına ayrılır
- Her bildirim item'ı: avatar + isim + aksiyon metni + zaman damgası + thumbnail (varsa)
- Level up bildirimleri özel animasyonlu kart olarak gösterilir
- Supabase Realtime subscription ile anlık güncelleme

---

## 🎮 Level & XP Sistemi

### Seviyeler ve Eşik Puanları

| Level | İsim | XP Gereksinimi | Kazanılan Özellik |
|---|---|---|---|
| 1 | 🍽️ Düz Yiyici | 0 XP | Akış görüntüleme, beğeni, takip, keşfet | 
| 2 | 🥄 Kaşıkçı | 150 XP | Gönderi paylaşma, yorum yapma |
| 3 | 🍳 Ev Aşçısı | 400 XP | Story paylaşma, liste oluşturma |
| 4 | 👨‍🍳 Usta Çırak | 900 XP | Instagram/TikTok embed paylaşma |
| 5 | 🔪 Sous Chef | 1800 XP | Özel profil rozeti, öncelikli keşfet |
| 6 | 🍴 Şef | 3500 XP | Lider tablosunda yer alma, şef rozeti |
| 7 | ⭐ Baş Şef | 6500 XP | Özel animasyonlu profil çerçevesi |
| 8 | ⚜️ Gastronom | 12000 XP | Tüm özellikler + Özel Bildirim Sesi/Ikonu + Gastronom Rozeti |
| 9 | 👑 Gurme | 18000 XP | Tüm özellikler + Gurme badge + özel renk teması |
| 10 | 🔱 Altın Çatal | 25000 XP | Tüm özellikler + Altın Çatal badge + Verified rozeti |


### XP Kazanım Tablosu

```typescript
const XP_ACTIONS = {
  like_given:           2,   // Beğeni vermek
  like_received:        3,   // Beğeni almak
  comment_given:        5,   // Yorum yazmak
  comment_received:     8,   // Yorum almak
  follow_given:         3,   // Birini takip etmek
  follow_received:      10,  // Takipçi kazanmak
  post_created:         25,  // Gönderi oluşturmak (Level 2+)
  story_created:        15,  // Story oluşturmak (Level 3+)
  save_received:        12,  // Kaydedilmek
  embed_shared:         20,  // Embed içerik paylaşmak (Level 4+)
  daily_login:          5,   // Günlük giriş streak bonusu
  streak_7_days:        50,  // 7 günlük streak bonusu
  streak_30_days:       200, // 30 günlük streak bonusu
  first_post:           30,  // İlk gönderi özel bonusu
  first_follow:         10,  // İlk takip özel bonusu
};
```

### Level Atlama Akışı

1. XP eşiği aşıldığında Supabase Edge Function tetiklenir
2. `level_up` bildirimi oluşturulur
3. Kullanıcı uygulamayı açtığında tam ekran **LevelUpSheet** gösterilir:
   - Konfeti animasyonu (react-native-confetti-cannon)
   - Yeni level ismi + ikonu (Lottie animasyonu)
   - Kazanılan yeni özellikler listesi
   - "Harika, devam et!" CTA butonu
4. Yeni özellikler anında aktif olur (Zustand store güncellenir)

### Ödül Sistemi

```typescript
type Reward = {
  id: string;
  type: 'badge' | 'theme' | 'frame' | 'feature' | 'xp_boost';
  name: string;
  description: string;
  icon: string;       // Lottie JSON veya emoji
  unlockedAtLevel: number;
};
```

Örnek ödüller: özel profil çerçeveleri, renk temaları, XP boost (24 saat x2 XP), özel rozet.

---

## 📲 Sosyal Medya Etkileşim Modülleri

Her modül kendi hook'una sahip, bağımsız çalışır ve Supabase'e yazar. XP kazanımı otomatik tetiklenir.

### `useLike(postId)`
```typescript
// Beğeni toggle, optimistic update, XP tetikle, bildirim gönder
{ isLiked, likeCount, toggleLike }
```

### `useFollow(targetUserId)`
```typescript
// Takip / takipten çık, karşılıklı takip tespiti, XP tetikle
{ isFollowing, followCount, toggleFollow }
```

### `useSave(postId)`
```typescript
// Kaydet / kaldır, liste seçimi (opsiyonel), XP tetikle
{ isSaved, toggleSave, saveToList }
```

### `useComment(postId)`
```typescript
// Yorum listesi, yorum ekle, yorum sil, XP tetikle, mention parse
{ comments, addComment, deleteComment, isLoading }
```

### `useEmbed(url)`
```typescript
// URL parse → platform detect → oEmbed fetch → WebView HTML hazırla
{ embedHtml, platform, thumbnail, isLoading, error }
// platform: 'instagram' | 'tiktok' | 'unknown'
```

---

## 🔗 Embed Sistemi

### Instagram Embed
- `https://api.instagram.com/oembed/?url={postUrl}&omitscript=true`
- Dönen `html` alanı WebView içinde render edilir
- Instagram embed.js enjekte edilir

### TikTok Embed
- `https://www.tiktok.com/oembed?url={videoUrl}`
- Dönen `html` WebView içinde render edilir
- Otomatik boyutlandırma için `injectedJavaScript` ile yükseklik hesaplanır

### EmbedCard Bileşeni
```
┌─────────────────────────────┐ ← GlassCard
│ [Platform logo] URL önizleme│ ← Üst bar
│                             │
│    [WebView — embed içerik] │ ← Merkez
│                             │
│ ❤️  💬  🔖  ↗️              │ ← Sosyal aksiyonlar
└─────────────────────────────┘
```

---

## 🗄️ Supabase Veritabanı Şeması

```sql
-- =============================================
-- USERS & AUTH
-- =============================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  bio           TEXT,
  avatar_url    TEXT,
  website       TEXT,
  is_private    BOOLEAN DEFAULT FALSE,
  level         INTEGER DEFAULT 1,
  xp            INTEGER DEFAULT 0,
  xp_next_level INTEGER DEFAULT 150,
  streak_days   INTEGER DEFAULT 0,
  last_active   TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FOLLOWS
-- =============================================
CREATE TABLE public.follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- =============================================
-- POSTS
-- =============================================
CREATE TABLE public.posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('photo', 'video', 'embed_instagram', 'embed_tiktok')),
  caption      TEXT,
  media_urls   TEXT[],           -- Supabase Storage URL'leri
  embed_url    TEXT,             -- Orijinal embed URL
  embed_html   TEXT,             -- Cache'lenmiş oEmbed HTML
  embed_thumbnail TEXT,
  location     TEXT,
  tags         TEXT[],
  is_archived  BOOLEAN DEFAULT FALSE,
  like_count   INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  save_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STORIES
-- =============================================
CREATE TABLE public.stories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url    TEXT NOT NULL,
  media_type   TEXT CHECK (media_type IN ('image', 'video')),
  duration     INTEGER DEFAULT 5,  -- saniye
  view_count   INTEGER DEFAULT 0,
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.story_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- =============================================
-- LIKES
-- =============================================
CREATE TABLE public.likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- =============================================
-- COMMENTS
-- =============================================
CREATE TABLE public.comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES comments(id) ON DELETE CASCADE,  -- yanıt sistemi
  content    TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.comment_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- =============================================
-- SAVED POSTS & LISTS
-- =============================================
CREATE TABLE public.lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_private  BOOLEAN DEFAULT TRUE,
  cover_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.saved_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  list_id    UUID REFERENCES lists(id) ON DELETE SET NULL,
  saved_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- =============================================
-- XP & LEVEL
-- =============================================
CREATE TABLE public.xp_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  action      TEXT NOT NULL,  -- 'like_given', 'post_created', vb.
  reference_id UUID,          -- ilgili post/comment/user id
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.level_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_level  INTEGER,
  to_level    INTEGER,
  xp_at_time  INTEGER,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.rewards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  description      TEXT,
  type             TEXT CHECK (type IN ('badge', 'theme', 'frame', 'feature', 'xp_boost')),
  unlock_level     INTEGER NOT NULL,
  icon_url         TEXT,
  metadata         JSONB DEFAULT '{}'
);

CREATE TABLE public.user_rewards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id   UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  is_equipped BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, reward_id)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL = sistem bildirimi
  type         TEXT NOT NULL CHECK (type IN (
    'like','comment','follow','follow_request',
    'save','mention','level_up','reward','xp_gained','system'
  )),
  title        TEXT,
  body         TEXT NOT NULL,
  reference_id UUID,      -- ilgili post/comment id
  is_read      BOOLEAN DEFAULT FALSE,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TAGS & EXPLORE
-- =============================================
CREATE TABLE public.tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_posts_user_id     ON posts(user_id);
CREATE INDEX idx_posts_created_at  ON posts(created_at DESC);
CREATE INDEX idx_follows_follower  ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_likes_post        ON likes(post_id);
CREATE INDEX idx_comments_post     ON comments(post_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_stories_user_expires    ON stories(user_id, expires_at);
CREATE INDEX idx_xp_transactions_user   ON xp_transactions(user_id, created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows         ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- Profiller: herkes görebilir, sadece kendisi düzenleyebilir
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Gönderiler: özel hesap değilse herkes görebilir
CREATE POLICY "posts_select" ON posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = posts.user_id AND (NOT is_private OR id = auth.uid()))
);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Takipler
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Beğeniler
CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Yorumlar
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Bildirimler: sadece alıcı görebilir
CREATE POLICY "notifications_recipient" ON notifications 
  FOR ALL USING (auth.uid() = recipient_id);

-- XP: sadece kendi işlemlerini görebilir
CREATE POLICY "xp_owner" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Beğeni sayacı güncelle + XP ver + bildirim gönder
CREATE OR REPLACE FUNCTION handle_like_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  post_owner UUID;
BEGIN
  -- Sayacı güncelle
  UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  
  -- Beğenen kullanıcıya XP ver
  INSERT INTO xp_transactions (user_id, amount, action, reference_id)
  VALUES (NEW.user_id, 2, 'like_given', NEW.post_id);
  
  -- Post sahibine XP ver ve bildirim gönder
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  IF post_owner != NEW.user_id THEN
    INSERT INTO xp_transactions (user_id, amount, action, reference_id)
    VALUES (post_owner, 3, 'like_received', NEW.post_id);
    
    INSERT INTO notifications (recipient_id, sender_id, type, body, reference_id)
    SELECT post_owner, NEW.user_id, 'like', 
           p.username || ' gönderini beğendi', NEW.post_id
    FROM profiles p WHERE p.id = NEW.user_id;
  END IF;
  
  -- XP toplamını güncelle ve level kontrolü yap
  PERFORM update_user_xp(NEW.user_id);
  IF post_owner != NEW.user_id THEN
    PERFORM update_user_xp(post_owner);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_insert
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION handle_like_insert();

CREATE OR REPLACE FUNCTION handle_like_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_like_delete
  AFTER DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION handle_like_delete();

-- Yorum sayacı + XP + bildirim
CREATE OR REPLACE FUNCTION handle_comment_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  post_owner UUID;
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  
  INSERT INTO xp_transactions (user_id, amount, action, reference_id)
  VALUES (NEW.user_id, 5, 'comment_given', NEW.post_id);
  
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  IF post_owner != NEW.user_id THEN
    INSERT INTO xp_transactions (user_id, amount, action, reference_id)
    VALUES (post_owner, 8, 'comment_received', NEW.post_id);
    
    INSERT INTO notifications (recipient_id, sender_id, type, body, reference_id, metadata)
    SELECT post_owner, NEW.user_id, 'comment',
           p.username || ' yorum yaptı: ' || LEFT(NEW.content, 50),
           NEW.post_id,
           jsonb_build_object('comment_id', NEW.id)
    FROM profiles p WHERE p.id = NEW.user_id;
  END IF;
  
  PERFORM update_user_xp(NEW.user_id);
  IF post_owner != NEW.user_id THEN PERFORM update_user_xp(post_owner); END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION handle_comment_insert();

-- Takip + XP + bildirim
CREATE OR REPLACE FUNCTION handle_follow_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO xp_transactions (user_id, amount, action, reference_id)
  VALUES (NEW.follower_id, 3, 'follow_given', NEW.following_id);
  
  INSERT INTO xp_transactions (user_id, amount, action, reference_id)
  VALUES (NEW.following_id, 10, 'follow_received', NEW.follower_id);
  
  INSERT INTO notifications (recipient_id, sender_id, type, body)
  SELECT NEW.following_id, NEW.follower_id, 'follow',
         p.username || ' seni takip etmeye başladı'
  FROM profiles p WHERE p.id = NEW.follower_id;
  
  PERFORM update_user_xp(NEW.follower_id);
  PERFORM update_user_xp(NEW.following_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_follow_insert
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_insert();

-- XP güncelleme ve level atlama fonksiyonu
CREATE OR REPLACE FUNCTION update_user_xp(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  total_xp     INTEGER;
  current_level INTEGER;
  new_level    INTEGER;
  level_thresholds INTEGER[] := ARRAY[0, 150, 400, 900, 1800, 3500, 6500, 12000];
  i            INTEGER;
  reward_rec   RECORD;
BEGIN
  -- Toplam XP hesapla
  SELECT COALESCE(SUM(amount), 0) INTO total_xp
  FROM xp_transactions WHERE user_id = p_user_id;
  
  -- Mevcut level
  SELECT level INTO current_level FROM profiles WHERE id = p_user_id;
  
  -- Yeni level hesapla
  new_level := 1;
  FOR i IN 1..array_length(level_thresholds, 1) LOOP
    IF total_xp >= level_thresholds[i] THEN
      new_level := i;
    END IF;
  END LOOP;
  
  -- Profili güncelle
  UPDATE profiles SET
    xp = total_xp,
    level = new_level,
    xp_next_level = CASE 
      WHEN new_level < array_length(level_thresholds, 1) 
      THEN level_thresholds[new_level + 1]
      ELSE level_thresholds[array_length(level_thresholds, 1)]
    END
  WHERE id = p_user_id;
  
  -- Level atlandıysa
  IF new_level > current_level THEN
    INSERT INTO level_history (user_id, from_level, to_level, xp_at_time)
    VALUES (p_user_id, current_level, new_level, total_xp);
    
    INSERT INTO notifications (recipient_id, type, title, body, metadata)
    VALUES (p_user_id, 'level_up', 'Seviye Atladın! 🎉',
            'Tebrikler! Level ' || new_level || '''e ulaştın!',
            jsonb_build_object('new_level', new_level, 'from_level', current_level));
    
    -- Bu level için ödülleri ver
    FOR reward_rec IN SELECT id FROM rewards WHERE unlock_level = new_level LOOP
      INSERT INTO user_rewards (user_id, reward_id)
      VALUES (p_user_id, reward_rec.id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$;

-- Gönderi oluşturulunca XP ver
CREATE OR REPLACE FUNCTION handle_post_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO xp_transactions (user_id, amount, action, reference_id)
  VALUES (NEW.user_id, 25, 'post_created', NEW.id);
  
  PERFORM update_user_xp(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_insert
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION handle_post_insert();

-- Story oluşturulunca XP ver
CREATE OR REPLACE FUNCTION handle_story_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO xp_transactions (user_id, amount, action, reference_id)
  VALUES (NEW.user_id, 15, 'story_created', NEW.id);
  
  PERFORM update_user_xp(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_story_insert
  AFTER INSERT ON stories
  FOR EACH ROW EXECUTE FUNCTION handle_story_insert();

-- Yeni kullanıcı profili oluştur (auth tetikleyicisi)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Yeni Kullanıcı')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- SEED: BAŞLANGIÇ ÖDÜLLERİ
-- =============================================
INSERT INTO rewards (name, description, type, unlock_level, metadata) VALUES
('Kaşık Rozeti',     'Level 2''ye ulaştın!',   'badge',   2, '{"color": "#F4A418"}'),
('Ev Aşçısı Çerçeve', 'Özel profil çerçevesi', 'frame',   3, '{"frameStyle": "kitchen"}'),
('Usta XP Boost',    '24 saat boyunca 2x XP',  'xp_boost',4, '{"multiplier": 2, "duration_hours": 24}'),
('Sous Chef Tema',   'Özel koyu tema',          'theme',   5, '{"themeKey": "sous_chef_dark"}'),
('Şef Rozeti',       'Elite şef rozeti',        'badge',   6, '{"color": "#C0513A", "animated": true}'),
('Baş Şef Çerçeve',  'Animasyonlu çerçeve',     'frame',   7, '{"animated": true}'),
('Gurme Teması',     'Altın premium tema',       'theme',   8, '{"themeKey": "gurme_gold"}');

-- =============================================
-- REALTIME (Supabase Dashboard'dan etkinleştir)
-- =============================================
-- Aşağıdaki tablolar için Realtime Publication ekle:
-- notifications, stories, posts (yeni gönderiler için akış)
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE stories;
```

---

## 📱 Ekran Detayları

### FeedScreen — Ana Akış
- Üstte story halkaları (Story Ring bileşeni), yatay scroll
- Altında sonsuz scroll feed: PostCard (fotoğraf/video/embed)
- Her PostCard: avatar + kullanıcı adı + level badge + içerik + sosyal aksiyonlar
- Pull-to-refresh, skeleton loading

### ExploreScreen — Keşfet
- Üstte arama çubuğu (GlassInput)
- Trending tag'ler yatay scroll
- Masonry grid: popüler gönderiler
- Filtreler: "Tümü", "Gönderi", "Embed", "Video"

### ListsScreen — Listeler
- Kullanıcının kaydettiği liste koleksiyonları
- Her liste için kapak görseli, isim, gönderi sayısı
- Yeni liste oluştur butonu (Level 3+ için aktif)

### ProfileScreen — Profil
- Kapak alanı: avatar + level rozeti + kullanıcı adı + bio
- XP progress bar (mevcut XP / sonraki level XP)
- Kazanılmış rozetler satırı
- Stat satırı: gönderi | takipçi | takip
- Grid: gönderiler / kaydedilenler / beğenilenler tab'ları

### CreateScreen — Oluştur (Modal Bottom Sheet)
- Level bazlı seçenek gösterimi:
  - "Gönderi Paylaş" — Level 2+ (kilitli ise kilit ikonu + "150 XP gerekli")
  - "Story Paylaş" — Level 3+ 
  - "Embed Paylaş" — Level 4+

---

## 🌙 Tema Sistemi

```typescript
// ThemeProvider context ile tüm app'e dağıtılır
// useTheme() hook'u her bileşende tema renklerine erişim sağlar
// AsyncStorage'da tema tercihi saklanır
// Sistem temasına (system) da uyum sağlar

const themes = {
  light: {
    background: '#FAF3E0',
    surface:    'rgba(255,253,247,0.72)',
    primary:    '#F4A418',
    text:       '#1C1C1E',
    textSecondary: '#8FA67A',
    border:     'rgba(244,164,24,0.25)',
    // ...
  },
  dark: {
    background: '#1C1C1E',
    surface:    'rgba(28,28,30,0.72)',
    primary:    '#F4A418',
    text:       '#FAF3E0',
    textSecondary: '#8FA67A',
    border:     'rgba(244,164,24,0.20)',
    // ...
  }
};
```

---

## ✅ Geliştirme Öncelikleri (Sıralı)

1. **Supabase kurulumu** — Tablolar, RLS, trigger'lar
2. **Auth akışı** — Kayıt, giriş, profil oluşturma
3. **Design system** — GlassCard, GlassButton, tema sistemi
4. **Floating navbar** — Tab navigasyon
5. **Feed** — PostCard, StoryRing, sonsuz scroll
6. **Sosyal modüller** — useLike, useFollow, useSave, useComment
7. **XP & Level sistemi** — xpCalculator, LevelUpSheet
8. **Bildirim sistemi** — Realtime subscription, NotificationScreen
9. **Embed sistemi** — useEmbed, EmbedCard (Instagram & TikTok)
10. **Oluştur akışı** — CreatePost, CreateStory (level kısıtlamalı)
11. **Keşfet & Listeler**
12. **Profil & Ayarlar** — Tema değiştirme, rozet koleksiyonu

---

*Bu prompt FoodSocial uygulamasının tüm teknik ve tasarım gereksinimlerini kapsamlı biçimde tanımlar. Her modül bağımsız geliştirilebilir ve Supabase gerçek zamanlı altyapısıyla production-ready bir uygulama elde edilir.*
