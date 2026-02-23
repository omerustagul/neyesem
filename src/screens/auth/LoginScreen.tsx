import { FontAwesome5 } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LoginMode = 'email' | 'phone';

const SPRING_CONFIG = { damping: 20, stiffness: 150 };

export const LoginScreen = ({ navigation }: any) => {
    const { theme, typography, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [mode, setMode] = useState<LoginMode>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [cardWidth, setCardWidth] = useState(0);

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
                // Ensure phone has prefix if not present for query
                const fullPhone = phone.startsWith('+90') ? phone : `+90${phone}`;
                const q = query(collection(db, 'profiles'), where('phone_number', '==', fullPhone));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    loginEmail = snapshot.docs[0].data().email;
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
        transform: [{ translateX: withSpring(modeSwitch.value * (cardWidth / 2), SPRING_CONFIG) }],
        width: cardWidth / 2,
    }));

    const inputContainerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: withSpring(-modeSwitch.value * cardWidth, SPRING_CONFIG) }],
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
                        {cardWidth > 0 && (
                            <View style={styles.inputsWrapper}>
                                <Animated.View style={inputContainerStyle}>
                                    {/* Email Input */}
                                    <Animated.View style={[styles.inputGroup, { width: cardWidth }, emailOpacity]}>
                                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                            E-posta Adresi
                                        </Text>
                                        <GlassInput
                                            placeholder="ornek@email.com"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </Animated.View>

                                    {/* Phone Input */}
                                    <Animated.View style={[styles.inputGroup, { width: cardWidth }, phoneOpacity]}>
                                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                            Telefon Numarası
                                        </Text>
                                        <View style={styles.phoneInputContainer}>
                                            <View style={[styles.countryCode, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                                                <Text style={[styles.countryText, { color: theme.text, fontFamily: typography.bodyMedium }]}>🇹🇷 +90</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <GlassInput
                                                    placeholder="5XX XXX XX XX"
                                                    value={phone}
                                                    onChangeText={setPhone}
                                                    keyboardType="phone-pad"
                                                    maxLength={10}
                                                />
                                            </View>
                                        </View>
                                    </Animated.View>
                                </Animated.View>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                        Şifre
                    </Text>
                    <GlassInput
                        placeholder="******"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
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
                        <TouchableOpacity
                            onPress={() => Alert.alert('Bilgi', 'Google ile giriş yakında aktif olacak.')}
                            style={[styles.socialButton, { borderColor: colors.glassBorder }]}
                        >
                            <FontAwesome5 name="google" size={24} color="#DB4437" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert('Bilgi', 'Apple ile giriş yakında aktif olacak.')}
                            style={[styles.socialButton, { borderColor: colors.glassBorder }]}
                        >
                            <FontAwesome5 name="apple" size={24} color={isDark ? '#fff' : '#000'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert('Bilgi', 'Facebook ile giriş yakında aktif olacak.')}
                            style={[styles.socialButton, { borderColor: colors.glassBorder }]}
                        >
                            <FontAwesome5 name="facebook" size={24} color="#1877F2" />
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
        marginBottom: 8,
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
        width: SCREEN_WIDTH - 48, // Padding adjusted for card content
        paddingRight: 16,
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
        marginTop: 8, // Matching GlassInput margin
        marginBottom: 8,
    },
    countryText: {
        fontSize: 14,
    },
    label: {
        fontSize: 14,
        marginBottom: 2,
        marginTop: 16,
    },
    button: {
        marginTop: 20,
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
        marginVertical: 24,
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
