import { FontAwesome5 } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { Image as ExpoImage } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../api/firebase';
import { GlassButton } from '../../components/glass/GlassButton';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassInput } from '../../components/glass/GlassInput';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LoginMode = 'email' | 'phone';

// Accelerated spring config for snappy feel
const SPRING_CONFIG = { damping: 30, stiffness: 400 };

// Separate component for Google Sign In to handle the hook safely
const GoogleSignInButton = ({ onLoading, isDark }: { onLoading: (loading: boolean) => void, isDark: boolean }) => {
    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'missing-ios-id',
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'missing-android-id',
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'missing-web-id',
    });

    useEffect(() => {
        if (response?.type === 'success' && response.params) {
            const { id_token } = response.params;
            if (id_token) {
                handleGoogleSignIn(id_token);
            }
        }
    }, [response]);

    const handleGoogleSignIn = async (idToken: string) => {
        onLoading(true);
        try {
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);
            const user = userCredential.user;

            const profileRef = doc(db, 'profiles', user.uid);
            const profileSnap = await getDoc(profileRef);

            if (!profileSnap.exists()) {
                const baseEmail = user.email || '';
                await setDoc(profileRef, {
                    uid: user.uid,
                    email: baseEmail,
                    username: (baseEmail ? baseEmail.split('@')[0].toLowerCase() : 'user') + Math.floor(Math.random() * 1000),
                    display_name: user.displayName || 'Gurme Kullanıcı',
                    avatar_url: user.photoURL || '',
                    phone_number: '',
                    gender: '',
                    birthday: '',
                    city: '',
                    bio: '',
                    created_at: new Date().toISOString(),
                    level: 1,
                    xp: 0,
                    xp_next_level: 150,
                    post_count: 0,
                    followers: [],
                    following: []
                });
            }
        } catch (error: any) {
            Alert.alert('Google Giriş Hatası', error.message);
        } finally {
            onLoading(false);
        }
    };

    return (
        <TouchableOpacity
            onPress={() => promptAsync()}
            disabled={!request}
            style={[styles.socialButton, { borderColor: colors.glassBorder }]}
        >
            <ExpoImage
                source="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png"
                style={{ width: 28, height: 28 }}
                contentFit="contain"
            />
        </TouchableOpacity>
    );
};

export const LoginScreen = ({ navigation }: any) => {
    const { theme, typography, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [mode, setMode] = useState<LoginMode>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [cardWidth, setCardWidth] = useState(0);

    const hasGoogleIds = !!(
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    );

    // Animation shared values
    const modeSwitch = useSharedValue(0); // 0 = email, 1 = phone

    const handleModeChange = (newMode: LoginMode) => {
        setMode(newMode);
        modeSwitch.value = withSpring(newMode === 'email' ? 0 : 1, SPRING_CONFIG);
    };

    const handleLogin = async () => {
        const identifier = mode === 'email' ? email : phone;
        if (!identifier || !password) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);
        try {
            let loginEmail = email;
            if (mode === 'phone') {
                // Normalize input: get last 10 digits to be flexible (handles +90, 90, 0 prefixes)
                const normalizedInput = phone.replace(/\D/g, '').slice(-10);

                if (normalizedInput.length < 10) {
                    throw new Error('Lütfen geçerli bir telefon numarası giriniz.');
                }

                // Fetch profiles to find the matching one (robust matching for messy DB data)
                const q = query(collection(db, 'profiles'));
                const snapshot = await getDocs(q);

                const matchedProfile = snapshot.docs.find(doc => {
                    const dbPhone = (doc.data().phone_number || '').replace(/\D/g, '');
                    return dbPhone.endsWith(normalizedInput);
                });

                if (matchedProfile) {
                    loginEmail = matchedProfile.data().email;
                } else {
                    throw new Error('Bu telefon numarası ile kayıtlı bir kullanıcı bulunamadı.');
                }
            }

            await signInWithEmailAndPassword(auth, loginEmail, password);
        } catch (error: any) {
            Alert.alert('Giriş Hatası', error.message);
        } finally {
            setLoading(false);
        }
    };

    const sliderStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: modeSwitch.value * (cardWidth / 2) }],
        width: cardWidth / 2,
    }));

    const inputContainerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: -modeSwitch.value * cardWidth }],
        flexDirection: 'row',
        width: cardWidth * 2,
    }));

    const emailOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(modeSwitch.value, [0, 0.4], [1, 0], Extrapolate.CLAMP),
    }));

    const phoneOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(modeSwitch.value, [0.6, 1], [0, 1], Extrapolate.CLAMP),
    }));

    const onContainerLayout = (event: any) => {
        const { width } = event.nativeEvent.layout;
        setCardWidth(width);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
                <Image
                    source={isDark ? require('../../../assets/images/appicon-dark_theme.webp') : require('../../../assets/images/appicon-light_theme.webp')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={[styles.subtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    Lezzet dünyasına geri dön!
                </Text>

                <GlassCard style={styles.card} contentStyle={{ padding: 20 }}>
                    <View onLayout={onContainerLayout} style={{ width: '100%' }}>
                        {/* Mode Selector */}
                        <View style={[styles.modeSelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}>
                            {cardWidth > 0 && <Animated.View style={[styles.modeSlider, sliderStyle, { backgroundColor: colors.saffron }]} />}
                            <TouchableOpacity
                                style={styles.modeItem}
                                onPress={() => handleModeChange('email')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.modeText, { color: mode === 'email' ? '#fff' : theme.secondaryText, fontFamily: typography.bodyMedium }]}>E-Posta</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modeItem}
                                onPress={() => handleModeChange('phone')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.modeText, { color: mode === 'phone' ? '#fff' : theme.secondaryText, fontFamily: typography.bodyMedium }]}>Telefon</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sliding Inputs */}
                        <View style={styles.inputsWrapper}>
                            {cardWidth > 0 && (
                                <Animated.View style={inputContainerStyle}>
                                    {/* Email Input */}
                                    <Animated.View style={[styles.inputGroup, { width: cardWidth }, emailOpacity]}>
                                        <GlassInput
                                            placeholder="E-posta Adresi"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            containerStyle={styles.compactInput}
                                        />
                                    </Animated.View>

                                    {/* Phone Input */}
                                    <Animated.View style={[styles.inputGroup, { width: cardWidth }, phoneOpacity]}>
                                        <View style={styles.phoneInputContainer}>
                                            <View style={[styles.countryCode, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                                                <Text style={[styles.countryText, { color: theme.text, fontFamily: typography.bodyMedium }]}>+90</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <GlassInput
                                                    placeholder="5XX XXX XX XX"
                                                    value={phone}
                                                    onChangeText={setPhone}
                                                    keyboardType="phone-pad"
                                                    maxLength={10}
                                                    containerStyle={styles.compactInput}
                                                />
                                            </View>
                                        </View>
                                    </Animated.View>
                                </Animated.View>
                            )}
                        </View>
                    </View>

                    <GlassInput
                        placeholder="Şifre"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        containerStyle={styles.compactInput}
                    />

                    <GlassButton
                        title={loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                        onPress={handleLogin}
                        style={styles.button}
                    />

                    <View style={styles.dividerContainer}>
                        <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                        <Text style={[styles.dividerText, { color: theme.secondaryText }]}>veya</Text>
                        <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                    </View>

                    <View style={styles.socialContainer}>
                        {hasGoogleIds ? (
                            <GoogleSignInButton onLoading={setLoading} isDark={isDark} />
                        ) : (
                            <TouchableOpacity
                                onPress={() => Alert.alert('Eksik Yapılandırma', 'Google Giriş anahtarları .env dosyasında eksik. Lütfen EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID vb. alanları doldurun.')}
                                style={[styles.socialButton, { borderColor: colors.glassBorder }]}
                            >
                                <ExpoImage
                                    source="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png"
                                    style={{ width: 28, height: 28, opacity: 0.5 }}
                                    contentFit="contain"
                                />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => Alert.alert('Bilgi', 'Apple ile giriş yakında aktif olacak.')}
                            style={[styles.socialButton, { borderColor: colors.glassBorder }]}
                        >
                            <FontAwesome5 name="apple" size={24} color={isDark ? '#fff' : '#000'} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Register')}
                        style={styles.linkButton}
                    >
                        <Text style={[styles.linkText, { color: colors.saffron, fontFamily: typography.bodyMedium }]}>
                            Hesabın yok mu? Kayıt ol
                        </Text>
                    </TouchableOpacity>
                </GlassCard>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: 60,
        width: 200,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 32,
    },
    card: {
        width: '100%',
        paddingBottom: 20,
    },
    modeSelector: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 24,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    modeSlider: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
        borderRadius: 20,
    },
    modeItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    modeText: {
        fontSize: 14,
    },
    inputsWrapper: {
        overflow: 'hidden',
        width: '100%',
    },
    inputGroup: {
        paddingRight: 1, // Small buffer
    },
    compactInput: {
        marginVertical: 4,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    countryCode: {
        height: 52,
        paddingHorizontal: 12,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
    },
    countryText: {
        fontSize: 14,
    },
    button: {
        marginTop: 16,
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 10,
    },
    socialButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
});


