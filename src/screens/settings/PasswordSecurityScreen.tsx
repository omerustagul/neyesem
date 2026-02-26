import { useNavigation } from '@react-navigation/native';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../api/firebase';
import { GlassCard } from '../../components/glass/GlassCard';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

type Step = 'verify' | 'newPassword' | 'success';

export const PasswordSecurityScreen = () => {
    const { theme, typography, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState<Step>('verify');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleVerifyCurrentPassword = async () => {
        if (!currentPassword.trim()) {
            Alert.alert('Hata', 'Mevcut şifrenizi girin.');
            return;
        }

        if (!user?.email) {
            Alert.alert('Hata', 'E-posta adresi bulunamadı.');
            return;
        }

        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Hata', 'Oturum bulunamadı. Lütfen tekrar giriş yapın.');
                return;
            }
            await reauthenticateWithCredential(currentUser, credential);
            setStep('newPassword');
        } catch (error: any) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                Alert.alert('Hata', 'Mevcut şifre yanlış. Lütfen tekrar deneyin.');
            } else if (error.code === 'auth/too-many-requests') {
                Alert.alert('Hata', 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.');
            } else {
                Alert.alert('Hata', 'Doğrulama yapılamadı. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword.trim() || !confirmPassword.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Hata', 'Şifreler eşleşmiyor.');
            return;
        }

        if (newPassword === currentPassword) {
            Alert.alert('Hata', 'Yeni şifre mevcut şifrenizden farklı olmalıdır.');
            return;
        }

        setLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert('Hata', 'Oturum bulunamadı.');
                return;
            }
            await updatePassword(currentUser, newPassword);
            setStep('success');
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                Alert.alert('Hata', 'Bu işlem için tekrar giriş yapmanız gerekiyor.');
                setStep('verify');
            } else {
                Alert.alert('Hata', 'Şifre değiştirilemedi. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderPasswordInput = (
        label: string,
        value: string,
        onChange: (v: string) => void,
        show: boolean,
        toggleShow: () => void,
        placeholder: string,
    ) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                {label}
            </Text>
            <View style={[styles.inputContainer, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            }]}>
                <Lock size={18} color={theme.secondaryText} />
                <TextInput
                    style={[styles.input, { color: theme.text, fontFamily: typography.body }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={theme.secondaryText}
                    secureTextEntry={!show}
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={toggleShow} activeOpacity={0.7}>
                    {show ? (
                        <EyeOff size={18} color={theme.secondaryText} />
                    ) : (
                        <Eye size={18} color={theme.secondaryText} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                >
                    <ArrowLeft size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                    Şifre ve Güvenlik
                </Text>
                <View style={{ width: 36 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Step Indicator */}
                    <View style={styles.stepsRow}>
                        {['verify', 'newPassword', 'success'].map((s, i) => {
                            const stepIndex = ['verify', 'newPassword', 'success'].indexOf(step);
                            const isActive = i <= stepIndex;
                            return (
                                <View key={s} style={styles.stepIndicator}>
                                    <View style={[styles.stepDot, {
                                        backgroundColor: isActive ? colors.saffron : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                                        width: i === stepIndex ? 24 : 8,
                                    }]} />
                                </View>
                            );
                        })}
                    </View>

                    {step === 'verify' && (
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 300 }}
                        >
                            <GlassCard style={styles.card}>
                                <View style={[styles.iconCircle, { backgroundColor: `${colors.saffron}15` }]}>
                                    <Mail size={28} color={colors.saffron} />
                                </View>
                                <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.display }]}>
                                    Kimliğinizi Doğrulayın
                                </Text>
                                <Text style={[styles.cardDescription, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                    Şifrenizi değiştirmek için önce mevcut şifrenizi girerek kimliğinizi doğrulamanız gerekiyor.
                                </Text>

                                <Text style={[styles.emailText, { color: theme.text, fontFamily: typography.mono }]}>
                                    {user?.email || 'E-posta bulunamadı'}
                                </Text>

                                {renderPasswordInput(
                                    'Mevcut Şifre',
                                    currentPassword,
                                    setCurrentPassword,
                                    showCurrentPassword,
                                    () => setShowCurrentPassword(!showCurrentPassword),
                                    'Mevcut şifrenizi girin',
                                )}

                                <TouchableOpacity
                                    style={[styles.primaryButton, { opacity: loading ? 0.7 : 1, backgroundColor: colors.saffron }]}
                                    onPress={handleVerifyCurrentPassword}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.primaryButtonText, { fontFamily: typography.bodyMedium }]}>
                                        {loading ? 'Doğrulanıyor...' : 'Doğrula'}
                                    </Text>
                                </TouchableOpacity>
                            </GlassCard>
                        </MotiView>
                    )}

                    {step === 'newPassword' && (
                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 300 }}
                        >
                            <GlassCard style={styles.card}>
                                <View style={[styles.iconCircle, { backgroundColor: `${colors.mintFresh}15` }]}>
                                    <Lock size={28} color={colors.mintFresh} />
                                </View>
                                <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.display }]}>
                                    Yeni Şifre Belirleyin
                                </Text>
                                <Text style={[styles.cardDescription, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                    Güçlü bir şifre belirleyin. En az 6 karakter olmalıdır.
                                </Text>

                                {renderPasswordInput(
                                    'Yeni Şifre',
                                    newPassword,
                                    setNewPassword,
                                    showNewPassword,
                                    () => setShowNewPassword(!showNewPassword),
                                    'Yeni şifrenizi girin',
                                )}

                                {renderPasswordInput(
                                    'Şifre Tekrar',
                                    confirmPassword,
                                    setConfirmPassword,
                                    showConfirmPassword,
                                    () => setShowConfirmPassword(!showConfirmPassword),
                                    'Yeni şifrenizi tekrar girin',
                                )}

                                {/* Password strength hints */}
                                <View style={styles.hints}>
                                    <View style={styles.hintRow}>
                                        <View style={[styles.hintDot, { backgroundColor: newPassword.length >= 6 ? colors.mintFresh : theme.border }]} />
                                        <Text style={[styles.hintText, { color: newPassword.length >= 6 ? colors.mintFresh : theme.secondaryText, fontFamily: typography.body }]}>
                                            En az 6 karakter
                                        </Text>
                                    </View>
                                    <View style={styles.hintRow}>
                                        <View style={[styles.hintDot, { backgroundColor: /[A-Z]/.test(newPassword) ? colors.mintFresh : theme.border }]} />
                                        <Text style={[styles.hintText, { color: /[A-Z]/.test(newPassword) ? colors.mintFresh : theme.secondaryText, fontFamily: typography.body }]}>
                                            En az bir büyük harf
                                        </Text>
                                    </View>
                                    <View style={styles.hintRow}>
                                        <View style={[styles.hintDot, { backgroundColor: /[0-9]/.test(newPassword) ? colors.mintFresh : theme.border }]} />
                                        <Text style={[styles.hintText, { color: /[0-9]/.test(newPassword) ? colors.mintFresh : theme.secondaryText, fontFamily: typography.body }]}>
                                            En az bir rakam
                                        </Text>
                                    </View>
                                    <View style={styles.hintRow}>
                                        <View style={[styles.hintDot, { backgroundColor: newPassword === confirmPassword && confirmPassword.length > 0 ? colors.mintFresh : theme.border }]} />
                                        <Text style={[styles.hintText, { color: newPassword === confirmPassword && confirmPassword.length > 0 ? colors.mintFresh : theme.secondaryText, fontFamily: typography.body }]}>
                                            Şifreler eşleşiyor
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.primaryButton, { opacity: loading ? 0.7 : 1, backgroundColor: colors.saffron }]}
                                    onPress={handleChangePassword}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.primaryButtonText, { fontFamily: typography.bodyMedium }]}>
                                        {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                                    </Text>
                                </TouchableOpacity>
                            </GlassCard>
                        </MotiView>
                    )}

                    {step === 'success' && (
                        <MotiView
                            from={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', damping: 15 }}
                        >
                            <GlassCard style={styles.card}>
                                <View style={[styles.iconCircle, { backgroundColor: `${colors.mintFresh}15`, width: 64, height: 64, borderRadius: 32 }]}>
                                    <ShieldCheck size={32} color={colors.mintFresh} />
                                </View>
                                <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.display }]}>
                                    Şifre Değiştirildi!
                                </Text>
                                <Text style={[styles.cardDescription, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                    Şifreniz başarıyla güncellendi. Bir sonraki girişinizde yeni şifrenizi kullanabilirsiniz.
                                </Text>

                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: colors.mintFresh }]}
                                    onPress={() => navigation.goBack()}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.primaryButtonText, { fontFamily: typography.bodyMedium }]}>
                                        Tamam
                                    </Text>
                                </TouchableOpacity>
                            </GlassCard>
                        </MotiView>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginBottom: 24,
    },
    stepIndicator: {},
    stepDot: {
        height: 8,
        borderRadius: 4,
    },
    card: {
        alignItems: 'center',
        padding: 24,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    emailText: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20,
        opacity: 0.8,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 15,
        height: '100%',
    },
    primaryButton: {
        width: '100%',
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    hints: {
        width: '100%',
        marginBottom: 8,
        gap: 6,
    },
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    hintDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    hintText: {
        fontSize: 12,
    },
});
