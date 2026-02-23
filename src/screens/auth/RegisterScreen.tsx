import DateTimePicker from '@react-native-community/datetimepicker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../api/firebase';
import { GlassButton } from '../../components/glass/GlassButton';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassInput } from '../../components/glass/GlassInput';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const RegisterScreen = ({ navigation }: any) => {
    const { theme, typography, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const setUser = useAuthStore((state) => state.setUser);

    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [birthday, setBirthday] = useState(new Date(2000, 0, 1));
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState<Date>(birthday);

    const genders = ['Erkek', 'Kadın', 'Diğer', 'Belirtmek istemiyorum'];

    const validateUsername = async (usernameValue: string) => {
        if (!usernameValue || usernameValue.length < 3) return false;
        const q = query(collection(db, 'profiles'), where('username', '==', usernameValue.toLowerCase()));
        const snapshot = await getDocs(q);
        return snapshot.empty;
    };

    const formatBirthday = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (selectedDate) setBirthday(selectedDate);
            return;
        }
        if (selectedDate) setTempDate(selectedDate);
    };

    const handleGenderPicker = () => {
        if (Platform.OS === 'ios') {
            const options = ['İptal', ...genders];
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: 0,
                    userInterfaceStyle: isDark ? 'dark' : 'light',
                },
                (buttonIndex) => {
                    if (buttonIndex > 0) setGender(genders[buttonIndex - 1]);
                }
            );
            return;
        }

        Alert.alert('Cinsiyet Seç', '', [
            ...genders.map((g) => ({
                text: g,
                onPress: () => setGender(g),
            })),
            { text: 'İptal', style: 'cancel' },
        ]);
    };

    const handleRegister = async () => {
        if (!displayName || !username || !email || !password || !confirmPassword || !gender) {
            Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
            return;
        }
        if (username.length < 3) {
            Alert.alert('Hata', 'Kullanıcı adı en az 3 karakter olmalı.');
            return;
        }
        if (!/^[a-zA-Z0-9_]*$/.test(username)) {
            Alert.alert('Hata', 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Hata', 'Şifreler eşleşmiyor.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Hata', 'Şifre en az 6 karakter olmalı.');
            return;
        }

        setLoading(true);
        try {
            const isAvailable = await validateUsername(username);
            if (!isAvailable) {
                Alert.alert('Hata', 'Bu kullanıcı adı zaten kullanılıyor.');
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;
            await setDoc(doc(db, 'profiles', userId), {
                uid: userId,
                email,
                display_name: displayName,
                username: username.toLowerCase(),
                birthday: formatBirthday(birthday),
                gender,
                phone_number: phone || '',
                bio: '',
                avatar_url: '',
                address: '',
                post_count: 0,
                followers: [],
                following: [],
                created_at: new Date().toISOString(),
                level: 1,
                xp: 0,
                intro_seen: false,
            });

            Alert.alert('Başarılı', 'Hesap oluşturuldu! Hoş geldiniz.');
            setUser(userCredential.user);
        } catch (error: any) {
            let errorMessage = 'Kayıt başarısız';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'Bu e-posta zaten kayıtlı.';
            if (error.code === 'auth/invalid-email') errorMessage = 'E-posta geçersiz.';
            if (error.code === 'auth/weak-password') errorMessage = 'Şifre yeterince güçlü değil.';
            Alert.alert('Hata', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 6 }]}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.pageTitle, { color: theme.text, fontFamily: typography.display }]}>Hesap Bilgileri</Text>
                </View>

                <GlassCard style={styles.card}>
                    <Text style={[styles.label, { fontFamily: typography.bodyMedium }]}>Kullanıcı Adı</Text>
                    <GlassInput
                        placeholder="ibrahimustagul"
                        value={username}
                        onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        autoCapitalize="none"
                    />
                    <Text style={[styles.hint, { fontFamily: typography.body }]}>
                        Kullanıcı adınızı 30 gün içinde en fazla 3 kez değiştirebilirsiniz.
                    </Text>

                    <Text style={[styles.label, { fontFamily: typography.bodyMedium }]}>Ad Soyad</Text>
                    <GlassInput
                        placeholder="Halil İbrahim Ustagül"
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCapitalize="words"
                    />

                    <Text style={[styles.label, { fontFamily: typography.bodyMedium }]}>E-Posta</Text>
                    <GlassInput
                        placeholder="example@email.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <Text style={[styles.errorHint, { fontFamily: typography.body }]}>E-posta adresi değiştirilemez.</Text>

                    <Text style={[styles.label, { fontFamily: typography.bodyMedium }]}>Doğum Tarihi</Text>
                    <TouchableOpacity style={styles.selectorButton} onPress={() => setShowDatePicker(true)}>
                        <Text style={[styles.selectorText, { color: theme.text, fontFamily: typography.body }]}>
                            {formatBirthday(birthday)}
                        </Text>
                        <ChevronDown color={theme.secondaryText} size={18} />
                    </TouchableOpacity>

                    <Text style={[styles.label, { fontFamily: typography.bodyMedium }]}>Telefon Numarası</Text>
                    <View style={styles.phoneRow}>
                        <GlassInput
                            placeholder="+90 555 123 45 67"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            containerStyle={styles.phoneInput}
                        />
                        <TouchableOpacity activeOpacity={0.8} style={styles.verifyButton}>
                            <Text style={[styles.verifyButtonText, { fontFamily: typography.bodyMedium }]}>Doğrula</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { fontFamily: typography.bodyMedium }]}>Adres</Text>
                    <GlassInput placeholder="Açık adresiniz" multiline containerStyle={styles.addressInput} />

                    <Text style={[styles.label, { fontFamily: typography.bodyMedium }]}>Cinsiyet</Text>
                    <TouchableOpacity style={styles.selectorButton} onPress={handleGenderPicker}>
                        <Text style={[styles.selectorText, { color: gender ? theme.text : theme.secondaryText, fontFamily: typography.body }]}>
                            {gender || 'Seçiniz'}
                        </Text>
                        <ChevronDown color={theme.secondaryText} size={18} />
                    </TouchableOpacity>

                    <Text style={[styles.label, { fontFamily: typography.bodyMedium }]}>Şifre</Text>
                    <GlassInput placeholder="Min 6 karakter" value={password} onChangeText={setPassword} secureTextEntry />

                    <Text style={[styles.label, { fontFamily: typography.bodyMedium }]}>Şifreyi Onayla</Text>
                    <GlassInput placeholder="Şifreyi tekrar gir" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                    <GlassButton title={loading ? 'Kayıt yapılıyor...' : 'Kaydet'} onPress={handleRegister} style={styles.button} />

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
                        <Text style={[styles.linkText, { color: colors.saffron, fontFamily: typography.bodyMedium }]}>
                            Hesabın var mı? Giriş yap
                        </Text>
                    </TouchableOpacity>
                </GlassCard>
            </ScrollView>

            {Platform.OS === 'ios' && showDatePicker && (
                <Modal transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                    <View style={styles.datePickerModal}>
                        <View style={[styles.datePickerContainer, { backgroundColor: theme.surface }]}>
                            <View style={styles.datePickerHeader}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setBirthday(tempDate);
                                        setShowDatePicker(false);
                                    }}
                                >
                                    <Text style={[styles.datePickerButton, { color: colors.saffron }]}>Tamam</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display="spinner"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                                minimumDate={new Date(1900, 0, 1)}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {Platform.OS !== 'ios' && showDatePicker && (
                <DateTimePicker
                    value={birthday}
                    mode="date"
                    display="calendar"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                />
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingBottom: 60,
    },
    header: {
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    pageTitle: {
        fontSize: 40,
    },
    card: {
        padding: 16,
        borderRadius: 16,
    },
    label: {
        fontSize: 13,
        marginBottom: 8,
        marginTop: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: colors.oliveMuted,
    },
    hint: {
        fontSize: 11,
        marginTop: -2,
        marginBottom: 10,
        color: colors.oliveMuted,
    },
    errorHint: {
        fontSize: 11,
        marginTop: -2,
        marginBottom: 10,
        color: colors.spiceRed,
    },
    selectorButton: {
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(13,120,68,0.12)',
        backgroundColor: '#F6F7F5',
        paddingHorizontal: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectorText: {
        fontSize: 15,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    phoneInput: {
        flex: 1,
    },
    verifyButton: {
        height: 48,
        borderRadius: 14,
        paddingHorizontal: 16,
        backgroundColor: '#EAF4EE',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(13,120,68,0.12)',
    },
    verifyButtonText: {
        color: colors.saffron,
        fontSize: 16,
    },
    addressInput: {
        minHeight: 96,
        alignItems: 'flex-start',
        paddingTop: 12,
    },
    button: {
        marginTop: 18,
    },
    linkButton: {
        marginTop: 12,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    datePickerModal: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.32)',
    },
    datePickerContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        marginBottom: 12,
    },
    datePickerButton: {
        fontSize: 16,
        fontWeight: '700',
    },
});
