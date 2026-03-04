# 🎬 ReelsScreen — Vizyoner Yeniden Tasarım
## Neyesem Uygulaması · Cursor/Windsurf Implementasyon Rehberi

> **Bu döküman bir AI kod editörü için hazırlanmıştır.**
> Mevcut `ReelsScreen.tsx` dosyası tamamen yeniden yazılacak.
> Tüm mevcut mantık (video oynatma, like, yorum, kaydet, arşiv, silme) korunacak —
> sadece layout, görsel hiyerarşi ve etkileşim katmanı yenileniyor.

---

## 🔍 Mevcut Yapının Sorunları

Yeniden tasarımda aşağıdaki sorunlar çözülmeli:

1. **Bilgi yoğunluğu:** Food info, kullanıcı, caption, ses butonu hepsi ayrı ayrı
   BlurView kutularına sarılmış. Sol taraf kalabalık ve dikey alanda çok yer kaplıyor.
2. **Büyük aksiyon butonları:** Sağ kolondaki `glassActionBtn` 44×44px — video içeriğiyle
   rekabet ediyor.
3. **Hiyerarşi yok:** Kullanıcı bilgisi ile yemek bilgisi aynı görsel ağırlıkta.
4. **Ses butonu yanlış yerde:** Sol altta caption ile aynı bölgede — kullanıcı onu yemek
   bilgisi sanıyor.
5. **Geri butonu ve başlık:** "Videolar" başlığı sol üstte sabit duruyor, video izleme
   deneyimini kırıyor.
6. **Food info her zaman açık:** Yemek detayları (süre, kalori, zorluk) sürekli görünür.
   İsteğe bağlı açılmalı.

---

## ✨ Yeni Tasarım Vizyonu

### Ana Prensip: **"Seyirci Modu"**
Video tam ekranı kaplasın. UI elemanları video üzerinde şeffaf, kompakt ve
**gerektiğinde görünür** olsun. Kullanıcı içeriğe odaklanır, detaylara isteyince ulaşır.

### Layout Mimarisi

```
┌─────────────────────────────────────┐  ← Tam ekran video
│                                     │
│  [← ]              [🔇]  [⋮]       │  ← Top bar: sadece geri + ses + more
│                                     │
│                                     │
│                                     │
│              (video)                │
│                                     │
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ @kullanici  Takip Et          │  │  ← Kullanıcı satırı (tek satır, kompakt)
│  │ Caption metni buraya girer... │  │  ← Caption (2 satır, expand edilebilir)
│  │ [⏱ 25dk] [🔥 320kcal] [Info→]│  │  ← Food pill (tek satır, inline)
│  └───────────────────────────────┘  │
│                                     │
│          [❤️]  [💬]  [🔖]           │  ← 3 aksiyon butonu, yatay, ortada
└─────────────────────────────────────┘
```

### Temel Değişiklikler

| Alan | Mevcut | Yeni |
|------|--------|------|
| Aksiyon butonları | Dikey sağ kolon, 44×44px | Yatay alt bar, 38×38px, aralarında boşluk |
| Food info | Her zaman açık BlurView kutu | Tek satır pill, "Detay" oku ile expand |
| Kullanıcı + caption | Ayrı ayrı BlurView | Tek birleşik glassmorphism panel |
| Ses butonu | Sol alt, caption yanı | Sağ üst köşe, geri butonuyla aynı satır |
| Geri + başlık | Her zaman görünür sol üst | Sadece ikon, `title` kaldırıldı |
| Platform badge | Ayrı BlurView kutusu | Kullanıcı adının yanında inline küçük chip |

---

## 🏗️ Bileşen Yapısı

```
ReelsScreen
└── FlatList
    └── ReelItem
        ├── VideoLayer          ← Tam ekran video (değişmedi)
        ├── PauseOverlay        ← Durdurulunca play ikonu (değişmedi)
        ├── SpeedIndicator      ← 2x göstergesi (değişmedi)
        ├── TopBar              ← YENİ: Geri + Ses + More tek satırda
        ├── BottomPanel         ← YENİ: Kullanıcı + caption + food + aksiyonlar
        │   ├── UserRow         ← Avatar + username + follow + platform chip
        │   ├── CaptionRow      ← Expandable caption
        │   ├── FoodPill        ← Kompakt tek satır, detay butonuyla
        │   └── ActionBar       ← YENİ: Yatay, 3 buton ortalanmış
        └── SelectionPopup      ← Değişmedi
```

---

## ADIM 1 — TopBar Bileşeni

Mevcut `backBtn` ve `reelsTitle` silinecek. Yerine `TopBar` gelecek.

```tsx
// ReelItem içinde — StyleSheet.absoluteFill üstüne render edilecek

const TopBar = () => (
  <View style={[topBarStyles.container, { top: insets.top + 8 }]}>
    {/* Geri butonu — sadece ikon, başlık yok */}
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={topBarStyles.iconBtn}
    >
      <BlurView intensity={30} tint="dark" style={topBarStyles.blurBtn}>
        <ArrowLeft size={18} color="#fff" />
      </BlurView>
    </TouchableOpacity>

    {/* Sağ grup: Ses + More */}
    <View style={topBarStyles.rightGroup}>
      <TouchableOpacity
        onPress={() => setIsMuted(!isMuted)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <BlurView intensity={30} tint="dark" style={topBarStyles.blurBtn}>
          {isMuted
            ? <VolumeX size={16} color="#fff" />
            : <Volume2 size={16} color="#fff" />
          }
        </BlurView>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleMorePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <BlurView intensity={30} tint="dark" style={topBarStyles.blurBtn}>
          <MoreVertical size={16} color="#fff" />
        </BlurView>
      </TouchableOpacity>
    </View>
  </View>
);

// Styles
const topBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    // hitSlop için wrapper
  },
  blurBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
```

---

## ADIM 2 — BottomPanel Bileşeni

Mevcut `bottomBar` (sol info + sağ aksiyon kolonu) tamamen kaldırılıyor.
Yerine tek bir `BottomPanel` geliyor.

```tsx
// ReelItem içinde render

const BottomPanel = () => (
  <View style={[panelStyles.container, { bottom: insets.bottom + 60 }]}>

    {/* Glassmorphism panel */}
    <BlurView
      intensity={40}
      tint="dark"
      style={panelStyles.glassPanel}
    >
      {/* ── Kullanıcı Satırı ── */}
      <UserRow />

      {/* ── Caption ── */}
      {!!post.caption && <CaptionRow />}

      {/* ── Yemek Bilgisi Pill ── */}
      {!!(post.cooking_time || post.difficulty || post.calories) && <FoodPill />}

      {/* ── Aksiyon Bar ── */}
      <ActionBar />
    </BlurView>

  </View>
);

const panelStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
  },
  glassPanel: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
    // Hafif saffron tonu — marka rengiyle uyum
    backgroundColor: 'rgba(20,18,14,0.55)',
  },
});
```

---

## ADIM 3 — UserRow

Avatar + kullanıcı adı + platform chip + takip et butonu.
Tümü tek yatay satırda.

```tsx
const UserRow = () => (
  <View style={userRowStyles.row}>
    {/* Avatar + isim */}
    <TouchableOpacity
      style={userRowStyles.userGroup}
      onPress={() => navigation.navigate('PublicProfile', { userId: post.userId })}
      activeOpacity={0.75}
    >
      <UserAvatar userId={post.userId} size={30} style={userRowStyles.avatar} />
      <Text
        style={[userRowStyles.username, { fontFamily: typography.bodyMedium }]}
        numberOfLines={1}
      >
        {post.username}
      </Text>
    </TouchableOpacity>

    {/* Platform chip — sadece embed içerikte göster */}
    {post.content_type === 'embed' && platform !== 'unknown' && (
      <View style={[
        userRowStyles.platformChip,
        { backgroundColor: platform === 'instagram' ? 'rgba(225,48,108,0.2)' : 'rgba(0,0,0,0.3)' }
      ]}>
        {platform === 'instagram'
          ? <Instagram size={9} color="#E1306C" />
          : <Music2 size={9} color="#fff" />
        }
        <Text style={[
          userRowStyles.platformText,
          { color: platform === 'instagram' ? '#E1306C' : '#fff' }
        ]}>
          {platform === 'instagram' ? 'IG' : 'TT'}
        </Text>
      </View>
    )}

    {/* Spacer */}
    <View style={{ flex: 1 }} />

    {/* Takip Et — sadece başkasının içeriğinde */}
    {!isOwner && (
      <TouchableOpacity style={userRowStyles.followBtn} activeOpacity={0.8}>
        <Text style={userRowStyles.followText}>Takip</Text>
      </TouchableOpacity>
    )}
  </View>
);

const userRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  userGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  username: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: width * 0.38,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformText: {
    fontSize: 9,
    fontWeight: '700',
  },
  followBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  followText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
```

---

## ADIM 4 — CaptionRow

2 satır kırpılı, "devamını gör" expandable. Değişen tek şey: ayrı BlurView yok,
doğrudan panel içine gömülü.

```tsx
const CaptionRow = () => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={() => showReadMoreButton && setIsCaptionExpanded(!isCaptionExpanded)}
  >
    <Text
      style={[captionStyles.text, { fontFamily: typography.body }]}
      numberOfLines={isCaptionExpanded ? undefined : 2}
      onTextLayout={(e) => {
        if (e.nativeEvent.lines.length > 2 && !showReadMoreButton && !isCaptionExpanded) {
          setShowReadMoreButton(true);
        }
      }}
    >
      {post.caption}
    </Text>
    {showReadMoreButton && !isCaptionExpanded && (
      <Text style={captionStyles.readMore}>devamını gör</Text>
    )}
  </TouchableOpacity>
);

const captionStyles = StyleSheet.create({
  text: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 18,
  },
  readMore: {
    color: colors.saffron,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
});
```

---

## ADIM 5 — FoodPill

Mevcut büyük food info kutusu (süre + zorluk + kalori + protein + "Yemek Hakkında"
butonu) yerine **tek satır kompakt pill** geliyor. Detaya ulaşmak için inline küçük ok butonu.

```tsx
// State ekle (ReelItem içine):
const [isFoodExpanded, setIsFoodExpanded] = useState(false);

// Bileşen:
const FoodPill = () => (
  <View>
    {/* Kompakt tek satır */}
    <TouchableOpacity
      style={foodStyles.pill}
      onPress={() => setIsFoodExpanded(!isFoodExpanded)}
      activeOpacity={0.8}
    >
      {/* Metrikler */}
      <View style={foodStyles.metrics}>
        {!!post.cooking_time && (
          <View style={foodStyles.metric}>
            <Timer size={11} color="rgba(255,255,255,0.7)" />
            <Text style={foodStyles.metricText}>{post.cooking_time}</Text>
          </View>
        )}
        {!!post.difficulty && (
          <View style={foodStyles.metric}>
            <Gauge size={11} color="rgba(255,255,255,0.7)" />
            <Text style={foodStyles.metricText}>{post.difficulty}</Text>
          </View>
        )}
        {!!post.calories && (
          <View style={foodStyles.metric}>
            <Flame size={11} color="rgba(255,255,255,0.7)" />
            <Text style={foodStyles.metricText}>{post.calories} kcal</Text>
          </View>
        )}
        {!!post.protein && (
          <View style={foodStyles.metric}>
            <ChefHat size={11} color="rgba(255,255,255,0.7)" />
            <Text style={foodStyles.metricText}>{post.protein}</Text>
          </View>
        )}
      </View>

      {/* Expand ok */}
      <View style={foodStyles.expandIcon}>
        <Info size={12} color={colors.saffron} />
      </View>
    </TouchableOpacity>

    {/* Expand edilince: "Yemek Hakkında" butonu */}
    {isFoodExpanded && (
      <TouchableOpacity
        activeOpacity={0.8}
        style={foodStyles.detailBtn}
        onPress={() => navigation.navigate('FoodDetail', { post })}
      >
        <ChefHat size={14} color={colors.saffron} />
        <GradientText
          colors={[colors.saffron, colors.spiceRed]}
          style={foodStyles.detailBtnText}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        >
          Yemek Hakkında →
        </GradientText>
      </TouchableOpacity>
    )}
  </View>
);

const foodStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244,164,24,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(244,164,24,0.20)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 11,
    fontWeight: '600',
  },
  expandIcon: {
    marginLeft: 8,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: 'rgba(244,164,24,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244,164,24,0.25)',
    paddingVertical: 7,
    borderRadius: 10,
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
```

---

## ADIM 6 — ActionBar (Yatay)

Mevcut dikey sağ kolon yerine **yatay, panelin altına yerleşik** 3 buton.
Butonlar küçüldü (38×38px), aralarında `flex` ile eşit dağılım var.

```tsx
const ActionBar = () => (
  <View style={actionStyles.bar}>

    {/* Beğen */}
    <TouchableOpacity
      style={actionStyles.btn}
      onPress={() => togglePostLike(post.id, user?.uid || '')}
      activeOpacity={0.75}
    >
      <Heart
        size={18}
        color={isLiked ? colors.spiceRed : 'rgba(255,255,255,0.9)'}
        fill={isLiked ? colors.spiceRed : 'transparent'}
      />
      <Text style={[actionStyles.count, isLiked && { color: colors.spiceRed }]}>
        {post.likes_count || 0}
      </Text>
    </TouchableOpacity>

    {/* Divider */}
    <View style={actionStyles.divider} />

    {/* Yorum */}
    <TouchableOpacity
      style={actionStyles.btn}
      onPress={onComment}
      activeOpacity={0.75}
    >
      <MessageCircle size={18} color="rgba(255,255,255,0.9)" />
      <Text style={actionStyles.count}>{post.comments_count || 0}</Text>
    </TouchableOpacity>

    {/* Divider */}
    <View style={actionStyles.divider} />

    {/* Kaydet */}
    <TouchableOpacity
      style={actionStyles.btn}
      onPress={onSave}
      activeOpacity={0.75}
    >
      <Bookmark
        size={18}
        color={isSaved ? colors.saffron : 'rgba(255,255,255,0.9)'}
        fill={isSaved ? colors.saffron : 'transparent'}
      />
      <Text style={[actionStyles.count, isSaved && { color: colors.saffron }]}>
        {post.saves_count || 0}
      </Text>
    </TouchableOpacity>

    {/* Divider */}
    <View style={actionStyles.divider} />

    {/* Paylaş */}
    <TouchableOpacity
      style={actionStyles.btn}
      onPress={handleShare}
      activeOpacity={0.75}
    >
      {/* lucide-react-native'den Share2 ikonu kullan */}
      <Share2 size={17} color="rgba(255,255,255,0.9)" />
    </TouchableOpacity>

  </View>
);

const actionStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    // Panelin geri kalanından ince çizgiyle ayır
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  count: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
});
```

> **Not:** `Share2` ikonunu import listesine ekle:
> ```tsx
> import { ..., Share2 } from 'lucide-react-native';
> ```
> Mevcut `handleShare` fonksiyonu aynen kullanılır.

---

## ADIM 7 — Tüm ReelItem Render Yapısı

Yukarıdaki tüm sub-bileşenlerin doğru sırada render edildiği nihai yapı:

```tsx
return (
  <View style={styles.reelContainer}>

    {/* ── Video Katmanı ── */}
    <TouchableOpacity
      activeOpacity={1}
      style={StyleSheet.absoluteFill}
      onPress={handleTap}
      onLongPress={() => setRate(2.0)}
      onPressOut={() => setRate(1.0)}
    >
      {/* WebView veya VideoView — mevcut mantık aynen kalır */}
      {/* ... */}
    </TouchableOpacity>

    {/* ── 2x Göstergesi ── */}
    {rate === 2.0 && (
      <View style={styles.speedIndicator}>
        <Text style={styles.speedText}>2×</Text>
      </View>
    )}

    {/* ── Durdurulma Overlay'i ── */}
    {isPaused && (
      <View style={styles.pauseOverlay}>
        <Play size={56} color="rgba(255,255,255,0.35)" fill="rgba(255,255,255,0.15)" />
      </View>
    )}

    {/* ── Üst Bar ── */}
    <TopBar />

    {/* ── Alt Panel ── */}
    <BottomPanel />

    {/* ── Options Menu ── */}
    <SelectionPopup
      visible={showOptionsMenu}
      title="Gönderi Seçenekleri"
      onClose={() => setShowOptionsMenu(false)}
      options={/* mevcut seçenekler aynen kalır */}
    />

  </View>
);
```

---

## ADIM 8 — Kaldırılacak Stiller

Aşağıdaki stiller artık kullanılmıyor, `StyleSheet`'ten silinmeli:

```
❌ rightActions
❌ bottomBar
❌ bottomInfoCol
❌ rightActionsCol
❌ actionBtn
❌ actionText
❌ glassActionBtn      → topBarStyles.blurBtn ile değiştirildi
❌ pillGlassSection    → BottomPanel'in glassPanel stili ile değiştirildi
❌ bottomInfo
❌ userInfo
❌ avatar              → userRowStyles.avatar ile değiştirildi
❌ username            → userRowStyles.username ile değiştirildi
❌ followBtn           → userRowStyles.followBtn ile değiştirildi
❌ followText          → userRowStyles.followText ile değiştirildi
❌ caption             → captionStyles.text ile değiştirildi
❌ musicContainer
❌ musicText           → ses butonu TopBar'a taşındı
❌ backBtn             → TopBar içinde yeniden yazıldı
❌ reelsTitle          → kaldırıldı
❌ foodInfoItem        → foodStyles.metric ile değiştirildi
❌ foodDetailBtn       → foodStyles.detailBtn ile değiştirildi
❌ foodDetailBtnText   → foodStyles.detailBtnText ile değiştirildi
❌ foodInfoText        → foodStyles.metricText ile değiştirildi
❌ platformBadge       → userRowStyles.platformChip ile değiştirildi
❌ platformText        → userRowStyles.platformText ile değiştirildi
```

**Korunan stiller:**

```
✅ container
✅ reelContainer
✅ video
✅ overlay          → sadece gradient için kullanılıyorsa koru
✅ speedIndicator
✅ speedText
✅ pauseOverlay
```

---

## ADIM 9 — Gradient Overlay

Videonun alt kısmına hafif karartma gradyanı ekle. Panel arkasındaki
videoyu daha okunaklı yapar.

```tsx
import { LinearGradient } from 'expo-linear-gradient';

// ReelItem return içinde, VideoView'dan hemen sonra:
<LinearGradient
  colors={['transparent', 'transparent', 'rgba(0,0,0,0.72)']}
  locations={[0, 0.45, 1]}
  style={StyleSheet.absoluteFill}
  pointerEvents="none"
/>
```

---

## ADIM 10 — ReelsScreen (Ana Ekran) Değişiklikleri

`ReelsScreen` bileşeninde yapısal değişiklik yok. Sadece şunlar güncelleniyor:

```tsx
// 1. Mevcut BackButton TouchableOpacity'yi kaldır (artık ReelItem içinde TopBar var):
// ❌ Şu satırları sil:
<TouchableOpacity
  style={[styles.backBtn, { top: insets.top + 10 }]}
  onPress={() => navigation.goBack()}
>
  <ArrowLeft size={28} color="#fff" />
  <Text style={styles.reelsTitle}>Videolar</Text>
</TouchableOpacity>

// 2. Share2 ikonunu import listesine ekle
import { ..., Share2 } from 'lucide-react-native';
```

---

## ✅ Implementasyon Kontrol Listesi

- [ ] `Share2` ikonunu import listesine ekle
- [ ] `LinearGradient` import'unu ekle (`expo-linear-gradient`)
- [ ] `isFoodExpanded` state'ini `ReelItem`'a ekle
- [ ] `TopBar` bileşenini yaz (ses butonu dahil)
- [ ] `UserRow` bileşenini yaz
- [ ] `CaptionRow` bileşenini yaz (mevcut expand mantığı korunur)
- [ ] `FoodPill` bileşenini yaz (`isFoodExpanded` ile detay toggle)
- [ ] `ActionBar` bileşenini yaz (yatay, 4 buton)
- [ ] `BottomPanel` bileşenini yaz (tüm sub-bileşenleri birleştirir)
- [ ] `LinearGradient` overlay'i VideoView'dan sonra ekle
- [ ] Ana `ReelItem` return'ünü yeni yapıya göre düzenle
- [ ] `ReelsScreen`'deki bağımsız BackButton bloğunu sil
- [ ] Kaldırılacak stiller listesindeki stilleri `StyleSheet`'ten temizle
- [ ] Eski `overlay` > `bottomBar` yapısını kaldır

---

## ⚠️ Dikkat Edilecek Noktalar

1. **`insets.bottom`:** `BottomPanel`'in `bottom` değeri `insets.bottom + 60` olarak
   ayarlandı — tab bar yüksekliğine göre ayarla.
2. **`isFoodExpanded`:** Yeni video'ya geçildiğinde `false`'a reset edilmeli.
   `isActive` prop'u değişince `useEffect` ile sıfırla:
   ```tsx
   useEffect(() => {
     if (!isActive) setIsFoodExpanded(false);
   }, [isActive]);
   ```
3. **Ses butonu:** `isMuted` state'i `TopBar` içinden set edildiği için
   mevcut `useEffect([..., isMuted, ...])` zaten çalışmaya devam eder.
4. **Platform badge:** Mevcut `PlatformBadge` bileşeni kaldırılıyor,
   mantığı `UserRow` içine taşındı.
5. **`handleShare`:** Mevcut `Share.share(...)` implementasyonu değişmedi,
   `ActionBar` içinden doğrudan çağrılıyor.
6. **`SelectionPopup` options:** Mevcut owner/non-owner seçenek listesi
   tamamen korunuyor — sadece trigger noktası `TopBar`'daki `MoreVertical` butonu.

---

*Döküman versiyonu: 1.0 | Neyesem Uygulaması | ReelsScreen Yeniden Tasarım*
