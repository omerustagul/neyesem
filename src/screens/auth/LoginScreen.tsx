import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../api/firebase';
import { GlassButton } from '../../components/glass/GlassButton';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassInput } from '../../components/glass/GlassInput';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const LoginScreen = ({ navigation }: any) => {
    const { theme, typography, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // user will be updated via AuthStore listener
        } catch (error: any) {
            Alert.alert('Giriş Hatası', error.message);
        } finally {
            setLoading(false);
        }
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

                <GlassCard style={styles.card}>
                    <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                        E-posta
                    </Text>
                    <GlassInput
                        placeholder="ornek@email.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

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
                            <Text style={[styles.socialIcon, { color: colors.spiceRed }]}>G</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert('Bilgi', 'Apple ile giriş yakında aktif olacak.')}
                            style={[styles.socialButton, { borderColor: colors.glassBorder }]}
                        >
                            <Text style={[styles.socialIcon, { color: theme.text }]}></Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Alert.alert('Bilgi', 'Facebook ile giriş yakında aktif olacak.')}
                            style={[styles.socialButton, { borderColor: colors.glassBorder }]}
                        >
                            <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
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
    title: {
        fontSize: 52,
        textAlign: 'center',
        marginBottom: 8,
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
        padding: 24,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        marginTop: 16,
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
    socialIcon: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});
