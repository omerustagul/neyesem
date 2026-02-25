# ✨ Açılış Animasyonu — Teknik Spesifikasyon
## Native Splash Screen + Scale & Glow Logo Animasyonu

> **Hedef:** Uygulama açılınca 1.5-2 saniyelik, akılda kalıcı bir giriş deneyimi.
> Native splash → JS hazır → Logo scale + glow animasyonu → Auth kontrolü → Ekrana geçiş.

---

## 1. Akış Diyagramı

```
Kullanıcı uygulamaya tıklar
          ↓
Native Splash Screen açılır (anında, ~0ms)
[expo-splash-screen — JS yüklenene kadar bekler]
          ↓
JavaScript bundle yüklenir (~300-500ms)
          ↓
Firebase Auth durumu kontrol edilir
          ↓
SplashScreen.hideAsync() çağrılır
          ↓
SplashAnimationScreen mount edilir
          ↓
Animasyon başlar (1.5s)
  → Logo scale: 0.3 → 1.15 → 1.0
  → Logo opacity: 0 → 1
  → Glow efekti: 0 → 1 → 0 (pulse)
  → Uygulama adı alttan fade-in
          ↓
Animasyon biter
          ↓
Auth durumuna göre yönlendir:
  ✅ Giriş yapılmış → FeedScreen
  ❌ Giriş yapılmamış → LoginScreen
```

---

## 2. Kurulum

```bash
# Native splash screen kontrolü
npx expo install expo-splash-screen

# Animasyon kütüphanesi
npx expo install react-native-reanimated

# Blur / glow efekti için
npx expo install @react-native-community/blur
```

---

## 3. app.json / app.config.js Ayarları

```json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "imageContentFit": "contain",
      "backgroundColor": "#1C1C1E"
    },
    "ios": {
      "splash": {
        "image": "./assets/splash.png",
        "imageContentFit": "contain",
        "backgroundColor": "#1C1C1E"
      }
    },
    "android": {
      "splash": {
        "image": "./assets/splash.png",
        "imageContentFit": "contain",
        "backgroundColor": "#1C1C1E",
        "resizeMode": "contain"
      }
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#1C1C1E",
          "image": "./assets/splash-icon.png",
          "imageContentFit": "contain",
          "enableFullScreenImage_legacy": true
        }
      ]
    ]
  }
}
```

> **Not:** `splash.png` ve `splash-icon.png` için koyu arka plan (#1C1C1E) üzerine
> saffron (#F4A418) tonlarında uygulama logosu kullanılmalıdır.
> Boyutlar: 1284x2778px (iOS), 1080x1920px (Android).

---

## 4. Root Uygulama Yapısı — `App.tsx`

```tsx
// App.tsx
import { useEffect, useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { auth } from './src/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import SplashAnimationScreen from './src/screens/SplashAnimationScreen';
import RootNavigator from './src/navigation/RootNavigator';

// Native splash'i hemen koru — JS yüklenirken kapanmasın
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [showSplashAnim, setShowSplashAnim] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // 1. Firebase Auth durumunu kontrol et
        await new Promise<void>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            unsubscribe();
            resolve();
          });
        });

        // 2. Gerekli asset'leri yükle (font, resim vb.)
        await loadAssets();

      } catch (error) {
        console.warn('App prepare error:', error);
      } finally {
        setAppReady(true);
      }
    };

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      // Native splash'i kapat, animasyonlu splash'i başlat
      await SplashScreen.hideAsync();
      setShowSplashAnim(true);
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {showSplashAnim ? (
        <SplashAnimationScreen
          user={user ?? null}
          onAnimationComplete={() => setShowSplashAnim(false)}
        />
      ) : (
        <RootNavigator initialUser={user ?? null} />
      )}
    </View>
  );
}

// Font ve asset yükleme
const loadAssets = async () => {
  const { useFonts, loadAsync } = await import('expo-font');
  await loadAsync({
    'PlayfairDisplay-Bold':   require('./assets/fonts/PlayfairDisplay-Bold.ttf'),
    'PlayfairDisplay-Regular':require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
    'DMSans-Regular':         require('./assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium':          require('./assets/fonts/DMSans-Medium.ttf'),
    'Fraunces-Regular':       require('./assets/fonts/Fraunces-Regular.ttf'),
  });
};
```

---

## 5. Animasyon Ekranı — `SplashAnimationScreen.tsx`

```tsx
// src/screens/SplashAnimationScreen.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import { User } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

type Props = {
  user: User | null;
  onAnimationComplete: () => void;
};

export default function SplashAnimationScreen({ user, onAnimationComplete }: Props) {

  // Animasyon değerleri
  const logoScale    = useSharedValue(0.3);
  const logoOpacity  = useSharedValue(0);
  const glowOpacity  = useSharedValue(0);
  const glowScale    = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const titleY       = useSharedValue(20);
  const bgOpacity    = useSharedValue(1);

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    // ── Aşama 1: Logo belirir (0ms - 400ms) ──────────────────────
    logoOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    // ── Aşama 2: Logo büyür (0ms - 700ms) ────────────────────────
    logoScale.value = withSequence(
      // 0.3 → 1.15 (overshoot)
      withTiming(1.15, {
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
      }),
      // 1.15 → 1.0 (settle)
      withTiming(1.0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      })
    );

    // ── Aşama 3: Glow efekti (300ms - 900ms) ─────────────────────
    glowOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(0.8, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(0.3, { duration: 500, easing: Easing.in(Easing.cubic) })
      )
    );
    glowScale.value = withDelay(
      300,
      withSequence(
        withTiming(1.4, { duration: 500, easing: Easing.out(Easing.cubic) }),
        withTiming(1.6, { duration: 400, easing: Easing.in(Easing.cubic) })
      )
    );

    // ── Aşama 4: Uygulama adı alttan çıkar (600ms - 900ms) ───────
    titleOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    titleY.value = withDelay(
      600,
      withSpring(0, { damping: 20, stiffness: 200 })
    );

    // ── Aşama 5: Ekran kaybolur ve navigator açılır (1500ms) ──────
    bgOpacity.value = withDelay(
      1500,
      withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished) runOnJS(onAnimationComplete)();
      })
    );
  };

  // Animasyon stilleri
  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const bgAnimStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, bgAnimStyle]}>

      {/* Arka plan gradient mesh */}
      <View style={styles.backgroundGradient} />

      {/* Glow halkası — logonun arkasında */}
      <Animated.View style={[styles.glowRing, glowAnimStyle]} />

      {/* Dış glow halkası */}
      <Animated.View style={[styles.glowRingOuter, glowAnimStyle]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoAnimStyle]}>
        {/* Buraya uygulama logonu koy */}
        {/* <Image source={require('../../assets/logo.png')} style={styles.logo} /> */}

        {/* Geçici metin logo (ikon hazır olana kadar) */}
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoEmoji}>🍽️</Text>
        </View>
      </Animated.View>

      {/* Uygulama adı */}
      <Animated.View style={[styles.titleContainer, titleAnimStyle]}>
        <Text style={styles.appName}>neyesem</Text>
        <Text style={styles.tagline}>lezzeti keşfet</Text>
      </Animated.View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
  },

  backgroundGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    // Saffron tonlarında çok hafif merkez parlaklığı
    backgroundColor: 'transparent',
    // LinearGradient kullanabilirsin:
    // expo-linear-gradient ile radial benzeri etki
  },

  // Ana glow halkası
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(244, 164, 24, 0.6)', // saffron
    shadowColor: '#F4A418',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },

  // Dış glow halkası (daha soluk)
  glowRingOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(244, 164, 24, 0.2)',
    shadowColor: '#F4A418',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
  },

  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    // Logo glow
    shadowColor: '#F4A418',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },

  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(244, 164, 24, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 164, 24, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoEmoji: {
    fontSize: 52,
  },

  // logo: {
  //   width: 100,
  //   height: 100,
  //   borderRadius: 24,
  // },

  titleContainer: {
    marginTop: 32,
    alignItems: 'center',
  },

  appName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 36,
    color: '#FAF3E0',        // cream
    letterSpacing: 2,
    // Yazı glow
    textShadowColor: 'rgba(244, 164, 24, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },

  tagline: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: 'rgba(244, 164, 24, 0.7)',
    letterSpacing: 4,
    marginTop: 6,
    textTransform: 'uppercase',
  },
});
```

---

## 6. Navigator Entegrasyonu — `RootNavigator.tsx`

```tsx
// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { User } from 'firebase/auth';

// Ekranlar
import LoginScreen   from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator();

type Props = {
  initialUser: User | null;
};

export default function RootNavigator({ initialUser }: Props) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'fade' }}
        initialRouteName={initialUser ? 'Main' : 'Login'}
      >
        {/* Auth Stack */}
        <Stack.Screen name="Login"    component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Ana Uygulama */}
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 7. Animasyon Zaman Çizelgesi

```
ms    0 ────────────────────────────────────────────── 1900ms
      │
   0ms│  Logo opacity: 0 ──────────────► 1
      │  Logo scale:   0.3 ─────────────────► 1.15 ─► 1.0
      │
 300ms│              Glow opacity: 0 ──► 0.8 ──────────► 0.3
      │              Glow scale:   0.8 ──► 1.4 ──────────► 1.6
      │
 600ms│                        Title opacity: 0 ──────► 1
      │                        Title Y:      +20 ─────► 0
      │
1500ms│                                    BG opacity: 1 ──► 0
      │
1900ms│                                              onAnimationComplete()
      │                                              → FeedScreen / LoginScreen
```

---

## 8. Performans & Edge Case'ler

### Düşük Güçlü Cihazlar
```tsx
import { AccessibilityInfo } from 'react-native';

// Reduced motion ayarı açıksa animasyonu atla
const isReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();

if (isReducedMotion) {
  // Animasyon yok, direkt geçiş
  onAnimationComplete();
  return;
}
```

### Uygulama Background'dan Dönünce
```tsx
// App.tsx — sadece cold start'ta splash göster
// Background → foreground geçişinde gösterme

import { AppState } from 'react-native';

const isFirstLaunch = useRef(true);

useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active' && !isFirstLaunch.current) {
      // Background'dan döndü — splash gösterme
    }
    isFirstLaunch.current = false;
  });
  return () => subscription.remove();
}, []);
```

### Auth Gecikmesi
Firebase Auth bazen yavaş yanıt verebilir. Maksimum bekleme süresi:
```tsx
// onAuthStateChanged için timeout ekle
const authPromise = new Promise<User | null>((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();
    resolve(user);
  });
});

const timeoutPromise = new Promise<null>((resolve) =>
  setTimeout(() => resolve(null), 3000) // 3 saniye max bekle
);

const user = await Promise.race([authPromise, timeoutPromise]);
```

---

## 9. Assets Checklist

```
assets/
  ├── splash.png              ← Native splash (1284x2778px önerilen)
  ├── splash-icon.png         ← Native splash ikonu (200x200px)
  ├── logo.png                ← Uygulama logosu (512x512px, şeffaf arka plan)
  └── fonts/
      ├── PlayfairDisplay-Bold.ttf
      ├── PlayfairDisplay-Regular.ttf
      ├── DMSans-Regular.ttf
      ├── DMSans-Medium.ttf
      └── Fraunces-Regular.ttf
```

**Renk uyumu:**
- Native splash arka plan: `#1C1C1E` (charcoalGrill)
- JS splash arka plan: `#1C1C1E` (aynı — geçişte renk zıplaması olmasın)
- Logo: Saffron `#F4A418` tonları
- Glow rengi: `#F4A418`

---

## 10. Geliştirme Öncelikleri

| # | Görev | Açıklama | Öncelik |
|---|-------|----------|---------|
| 1 | `app.json` splash ayarları | Arka plan rengi ve ikon | Kritik |
| 2 | `SplashScreen.preventAutoHideAsync()` | App.tsx başına ekle | Kritik |
| 3 | `SplashAnimationScreen.tsx` | Animasyon bileşeni | Kritik |
| 4 | `RootNavigator` auth kontrolü | initialRouteName | Kritik |
| 5 | Font yükleme | loadAsync | Yüksek |
| 6 | Reduced motion desteği | Erişilebilirlik | Orta |
| 7 | Auth timeout | 3 saniyelik güvenlik | Orta |
| 8 | Logo asset'i | Gerçek logo ile değiştir | Yüksek |

---

*Döküman versiyonu: 1.0 | Son güncelleme: Şubat 2026*
*Kapsam: Native Splash + Animasyonlu Açılış Ekranı + Auth Yönlendirme*
