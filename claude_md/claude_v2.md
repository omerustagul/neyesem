# 🍽️ Neyesem — Güncelleme Spesifikasyonu v2.0

> Bu döküman uygulamada yapılacak tüm değişiklikleri, teknik gereksinimlerini ve implementasyon detaylarını kapsamaktadır.

---

## 1. Navbar — Animasyonlu Kayan Nokta & Swipe Navigasyon

### 1.1 Kayan Nokta Animasyonu

Aktif tab'ı gösteren nokta indikatörü, tab değişiminde **yeni tab'ın altına animasyonlu kayarak** geçiş yapmalıdır.

**Teknik Gereksinimler:**
- Nokta pozisyonu `Reanimated 2` ile `useSharedValue` + `withSpring` kullanılarak interpolate edilir
- Spring config: `{ damping: 18, stiffness: 200, mass: 0.8 }` — hızlı ama yumuşak
- Nokta boyutu geçiş sırasında hafifçe genişler (`width: 6px → 14px`) sonra tekrar küçülür (pill efekti)
- Renk: `saffron (#F4A418)`
- Nokta, tüm tab ikonlarının x pozisyonları `onLayout` ile ölçülerek doğru hedefe kayan bir `Animated.View` olarak implement edilir

```tsx
// Örnek yapı
const indicatorX = useSharedValue(0);
const indicatorWidth = useSharedValue(6);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: indicatorX.value }],
  width: indicatorWidth.value,
}));

const handleTabPress = (index: number) => {
  indicatorWidth.value = withSpring(14);
  indicatorX.value = withSpring(tabPositions[index], { damping: 18, stiffness: 200 });
  setTimeout(() => { indicatorWidth.value = withSpring(6); }, 250);
};
```

### 1.2 Swipe (Parmakla Kaydırma) Navigasyon

Ana tab ekranları (`Akış`, `Keşfet`, `Listelerim`, `Profil`) arasında yatay swipe ile geçiş yapılabilir.

**Teknik Gereksinimler:**
- `react-native-pager-view` veya `Reanimated` tabanlı yatay `FlatList` ile implement edilir
- Swipe yönü ile navbar nokta animasyonu **senkronize** çalışır — kullanıcı parmağını sürüklediğinde nokta da gerçek zamanlı kayar (interpolation ile)
- Oluştur butonu (merkezdeki `+`) swipe'a dahil **değildir**, her zaman sabittir
- Swipe threshold: `%40` ekran genişliği geçilirse sayfa değişir, geçilmezse geri döner (spring ile)
- Geçiş animasyonu: yatay slide + hafif `opacity` fade (0.85 → 1.0)

```tsx
// PagerView ile senkron nokta hareketi
<PagerView
  onPageScroll={(e) => {
    const { offset, position } = e.nativeEvent;
    indicatorX.value = interpolate(
      position + offset,
      tabPositions.map((_, i) => i),
      tabPositions
    );
  }}
/>
```

---

## 2. Profil — Level Card Yeniden Tasarımı

### 2.1 Tasarım Vizyonu

Level card statik bir bilgi kartı olmaktan çıkıp **kullanıcının ilerleme hikayesini anlatan, canlı ve animasyonlu** bir bileşen haline gelir.

### 2.2 Görsel Tasarım

```
┌─────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░ (gradient mesh arka plan) ░░░░░░░░░░░ │
│                                                     │
│  ⚜️  GASTRONOMsun          [Rozet Animasyonu →]     │
│                                                     │
│  ████████████████████░░░░░░░  68%  → Altın Çatal   │
│  8,240 / 12,000 XP                                  │
│                                                     │
│  🔥 12 Günlük Seri    ⚡ Bu Hafta: +340 XP          │
│                                                     │
│  [Rozetlerim]  [Ödüllerim]  [Lider Tablosu]        │
└─────────────────────────────────────────────────────┘
```

### 2.3 Animasyonlar

- **Gradient arka plan:** `saffron → terracotta → oliveDark` renkleri arasında yavaş dönen mesh gradient (Reanimated ile `useSharedValue` loop animasyonu, ~8 saniyelik döngü)
- **XP Progress Bar:**
  - Ekran açıldığında `0`'dan mevcut değere dolum animasyonu (`withTiming`, 1200ms, `Easing.out(Easing.cubic)`)
  - Bar üzerinde hafif parlama efekti (shimmer) sürekli kayar
  - Bar dolduğunda kısa konfeti efekti tetiklenir
- **Level Rozeti:**
  - Hafif pulse animasyonu (scale 1.0 → 1.06 → 1.0, 2 saniye loop)
  - Rozete tıklanınca tüm level yolculuğunu gösteren modal açılır
- **Streak Sayacı:** Her gün `+1` değişiminde flip animasyonu (kart çevirme efekti)
- **Haftalık XP:** Küçük bar chart olarak gösterilir, son 7 günün günlük XP dağılımıyla

### 2.4 Etkileşim

- Karta tıklanınca **Level Detay Modal**'ı açılır:
  - Tüm 10 level, mevcut konum vurgulanmış şekilde timeline görünümünde
  - Her level için kazanımlar listesi
  - "Sonraki ödülüne X XP kaldı" motivasyon mesajı

---

## 3. Settings Ekranı — Modal Yapı & Tema Seçici

### 3.1 Ekran Yapısı

- Settings ekranı **stack modal** olarak açılır (`presentation: 'modal'` veya `'card'`)
- Ana navbar ve header **gizlenir** (`headerShown: false`, `tabBarStyle: { display: 'none' }`)
- Sol üstte **geri git butonu** (`←` ikonu, GlassButton stilinde)
- Ekran başlığı custom header içinde: "Ayarlar"

### 3.2 Tema Seçimi — Native Picker

`Görünüm` ayarı bir switch yerine **platform'a özgü seçici** ile açılır:

**iOS:**
```tsx
// ActionSheet (UIActionSheet benzeri)
ActionSheetIOS.showActionSheetWithOptions({
  options: ['İptal', '☀️ Açık Mod', '🌙 Koyu Mod', '📱 Sistem'],
  cancelButtonIndex: 0,
}, (index) => {
  const themes = [null, 'light', 'dark', 'system'];
  if (themes[index]) setTheme(themes[index]);
});
```

**Android:**
```tsx
// Native Dialog (AlertDialog benzeri)
// react-native-paper'ın RadioButton.Group'u ile modal içinde
// veya @react-native-community/datetimepicker benzeri native dialog
<RadioButton.Group onValueChange={setTheme} value={currentTheme}>
  <RadioButton.Item label="☀️ Açık Mod"  value="light"  />
  <RadioButton.Item label="🌙 Koyu Mod"  value="dark"   />
  <RadioButton.Item label="📱 Sistem"    value="system" />
</RadioButton.Group>
```

Seçim yapıldığında tema **anlık** değişir, `AsyncStorage`'a kaydedilir.

### 3.3 Çıkış Yap Butonu

- Ayarlar listesinin **en altında**, diğer butonlardan görsel olarak ayrı
- Renk: `spiceRed (#E03E2D)`, ikon: `LogOut`
- Tıklanınca onay dialogu:
  > "Çıkış yapmak istediğine emin misin?"
  > [Vazgeç] [Çıkış Yap]
- Onaylanınca: Supabase `auth.signOut()` → tüm store'lar temizlenir → Auth stack'e yönlendirme

```typescript
const handleSignOut = async () => {
  await supabase.auth.signOut();
  useAuthStore.getState().reset();
  useFeedStore.getState().reset();
  // diğer store'lar...
  navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
};
```

---

## 4. Oluştur Ekranı — Yeniden Tasarım

### 4.1 Ekran Yapısı

- Navbar `+` butonuna tıklanınca **bottom sheet modal** değil, **tam ekran modal** açılır
- Header ve navbar **gizlenir**
- Sol üstte `✕` kapat butonu

### 4.2 Ana Oluştur Ekranı Tasarımı

```
┌─────────────────────────────────────┐
│  ✕                       Oluştur   │
│                                     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  📖  Gönderi Oluştur        │   │  ← GlassCard, büyük
│   │  Fotoğraf veya video paylaş │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  ✨  Hikaye Oluştur         │   │  ← GlassCard, büyük
│   │  24 saatte kaybolan anlar   │   │
│   └─────────────────────────────┘   │
│                                     │
│   [Kilitli seçenekler level badge]  │
└─────────────────────────────────────┘
```

### 4.3 Gönderi Oluşturma — Step-by-Step Akış

Instagram mantığıyla adım adım ilerleyen, tutarlı bir akış:

#### Step 1 — Medya Seçimi
- Galeri grid görünümü (full screen)
- Alt kısımda `Kamera`, `Galeri`, `Video` sekmeleri
- Çoklu seçim desteği (max 10 medya)
- Seçilen medyalar alt barда küçük thumbnail olarak görünür
- Sağ üstte `İleri →` butonu

#### Step 2 — Kırpma & Düzenleme
- Seçilen medya tam ekran, dokunarak zoom/kaydırma
- Kırpma oranları: `1:1`, `4:5`, `16:9`, `Orijinal`
- Filtreler: yatay scroll, canlı önizleme
- Temel düzenlemeler: Parlaklık, Kontrast, Doygunluk (slider)
- Sağ üstte `İleri →`

#### Step 3 — Detaylar & Paylaşım
- Açıklama metin alanı (mention `@` ve hashtag `#` desteği)
- Konum ekleme
- Etiket ekleme
- "Gelişmiş Ayarlar" accordion: yorum kapatma, beğeni gizleme
- `Paylaş` butonu (saffron, tam genişlik)
- Paylaşım sonrası: başarı animasyonu → akış ekranına dönüş + XP bildirimi

```typescript
// Step yönetimi
type CreateStep = 'media_select' | 'crop_edit' | 'details';

const useCreateStore = create<CreateStore>((set) => ({
  step: 'media_select',
  selectedMedia: [],
  cropData: null,
  caption: '',
  location: null,
  tags: [],
  setStep: (step) => set({ step }),
  // ...
}));
```

### 4.4 Hikaye Oluşturma — Step-by-Step Akış

#### Step 1 — Medya Seçimi
- Kamera önizlemesi (fotoğraf çek / video kaydet)
- Galeri'den seç seçeneği
- Flash, kamera değiştir kontrolleri

#### Step 2 — Düzenleme
- Metin ekleme (farklı font stilleri)
- Emoji / sticker ekleme
- Çizim aracı
- Müzik ekleme (opsiyonel)
- Süre ayarı (fotoğraf için: 3-10 sn)

#### Step 3 — Paylaşım
- "Hikayeni Paylaş" butonu
- Paylaşım sonrası: 24 saatlik süre göstergesiyle akış'a dönüş

---

## 5. Akış — Gerçek Zamanlı Database Entegrasyonu

### 5.1 Template Gönderilerin Kaldırılması

- Tüm hardcoded/mock post verisi temizlenir
- `FeedScreen` artık yalnızca Supabase'den gelen gerçek veriyi render eder

### 5.2 Feed Query Mantığı

```typescript
const useFeedPosts = () => {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: followingIds } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      const ids = followingIds?.map(f => f.following_id) ?? [];
      ids.push(currentUserId); // kendi gönderilerini de göster

      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, avatar_url, level),
          likes (id, user_id),
          comments (count),
          saved_posts (id, user_id)
        `)
        .in('user_id', ids)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + 9);

      return data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage?.length === 10 ? pages.length * 10 : undefined,
  });
};
```

### 5.3 Embed Post Render

- `type: 'embed_instagram'` veya `type: 'embed_tiktok'` olan gönderiler `EmbedCard` bileşeniyle render edilir
- `embed_html` alanı cache'li olarak WebView'e beslenir
- Cache yoksa oEmbed API'si çağrılır, sonuç DB'ye yazılır

### 5.4 Realtime Feed Güncellemesi

```typescript
// Yeni gönderi gelince feed'i güncelle
supabase
  .channel('public:posts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts',
    filter: `user_id=in.(${followingIds.join(',')})`,
  }, (payload) => {
    feedStore.prependPost(payload.new);
    // "Yeni gönderi" toast bildirimi göster
  })
  .subscribe();
```

---

## 6. Story Modülü — Tam Entegrasyon

### 6.1 Akış Ekranı Story Bar

Instagram benzeri story halkaları akış ekranının üstünde sabit kalır:

```
┌──────────────────────────────────────────────────┐
│  [+Ben]  [Ali]  [Ayşe]  [Mehmet]  [Zeynep] →   │
└──────────────────────────────────────────────────┘
```

- **Kullanıcının kendi butonu** her zaman en solda
  - Story yoksa: `+` ikonu, tıklayınca hikaye oluşturma ekranı
  - Story varsa: profil fotoğrafı, renkli halka, tıklayınca kendi story'si açılır
- **Takip edilenlerin butonları:** izlenmemiş story için **renkli halka** (saffron gradient), izlenmiş için **gri halka**
- Yeni story gelince Supabase Realtime ile otomatik güncelleme

### 6.2 Story Görüntüleme Ekranı

**Temel Yapı:**
- Tam ekran, siyah arka plan
- Üstte progress bar (her story için ayrı segment)
- Dokunarak ileri/geri gitme
- Sola/sağa swipe ile kullanıcı değiştirme
- Çıkış için aşağı swipe (dismiss gesture)

**Kendi Story'sini İzlerken:**
- Sağ üstte `⋯` menü butonu
- Menü seçenekleri: "Story'yi Kaldır", "İzleyenler"
- İzleyenler listesi: kullanıcı adı + avatar + **sağ alt köşede tepki emojisi** (varsa)

**Başkasının Story'sini İzlerken:**
- Alt kısımda emoji tepki butonu `😊`
- Tıklanınca **Glass popup** açılır — emoji grid:
  ```
  ❤️  😂  😮  😢  🔥  👏  😍  🤤
  ```
- Emoji seçilince:
  1. Seçilen emoji ekranda patlama/yayılma animasyonu oynar (Lottie veya Reanimated)
  2. Karşı kullanıcıya bildirim gider
  3. Supabase `story_reactions` tablosuna yazılır
  4. Karşı kullanıcı izleyenler listesinde bu emoji görünür

### 6.3 Story Tepki Animasyonları

```typescript
// Tepki animasyonu — emoji ekranda yükseliyor
const triggerReactionAnimation = (emoji: string) => {
  // Birden fazla emoji parçacığı
  // Her biri farklı x pozisyonu, farklı rotation, farklı scale
  // withSequence: görün → yukarı uç → kaybol
  for (let i = 0; i < 6; i++) {
    const particle = {
      x: randomBetween(80, screenWidth - 80),
      delay: i * 80,
    };
    // Reanimated ile her parçacık animate edilir
  }
};
```

### 6.4 Supabase — Story Ek Tabloları

```sql
-- Story tepkileri
CREATE TABLE public.story_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  reacted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)  -- her kullanıcı bir story'e bir tepki
);

CREATE INDEX idx_story_reactions_story ON story_reactions(story_id);

-- RLS
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "story_reactions_select" ON story_reactions FOR SELECT USING (true);
CREATE POLICY "story_reactions_insert" ON story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "story_reactions_delete" ON story_reactions FOR DELETE USING (auth.uid() = user_id);

-- Tepki gelince bildirim gönder
CREATE OR REPLACE FUNCTION handle_story_reaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  story_owner UUID;
BEGIN
  SELECT user_id INTO story_owner FROM stories WHERE id = NEW.story_id;
  
  IF story_owner != NEW.user_id THEN
    INSERT INTO notifications (recipient_id, sender_id, type, body, metadata)
    SELECT story_owner, NEW.user_id, 'system',
           p.username || ' hikayene ' || NEW.emoji || ' tepkisi verdi',
           jsonb_build_object('story_id', NEW.story_id, 'emoji', NEW.emoji)
    FROM profiles p WHERE p.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_story_reaction
  AFTER INSERT ON story_reactions
  FOR EACH ROW EXECUTE FUNCTION handle_story_reaction();
```

### 6.5 Story Modülü Hook'ları

```typescript
// Modüler story hook'ları
useStories(userId?)          // Belirli kullanıcı veya takip edilenlerin story'leri
useStoryViewer(storyId)      // Story izleme — progress, timer, navigation
useStoryReaction(storyId)    // Tepki gönderme + animasyon tetikleme
useStoryViewers(storyId)     // İzleyenler listesi (Realtime)
useCreateStory()             // Story oluşturma & yükleme
```

---

## 📋 Değişiklik Özeti

| # | Bileşen | Tür | Öncelik |
|---|---------|-----|---------|
| 1 | Navbar kayan nokta + swipe navigasyon | Yeni özellik | Yüksek |
| 2 | Level Card yeniden tasarımı | UI/UX iyileştirme | Orta |
| 3 | Settings modal yapı + native tema seçici | Refactor | Yüksek |
| 4 | Settings çıkış yap butonu | Yeni özellik | Yüksek |
| 5 | Oluştur ekranı tam yeniden tasarım | Yeni özellik | Yüksek |
| 6 | Feed — mock data kaldırma + DB entegrasyonu | Refactor | Kritik |
| 7 | Story modülü — tam entegrasyon | Yeni özellik | Kritik |

---

## 🔗 Bağımlılıklar (Yeni Eklenecek Paketler)

```bash
# Swipe navigasyon
npx expo install react-native-pager-view

# Blur / glass efekti
npx expo install @react-native-community/blur

# Animasyon
npx expo install react-native-reanimated moti

# Medya seçici (gönderi/story oluşturma)
npx expo install expo-image-picker expo-camera expo-av

# Konfeti (level atlama)
npm install react-native-confetti-cannon

# Sonsuz scroll / query
npm install @tanstack/react-query
```

---

*Döküman versiyonu: 2.0 | Son güncelleme: Şubat 2026*
