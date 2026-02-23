import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, Camera, Check, ChevronDown } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../api/firebase';
import { GlassButton } from '../../components/glass/GlassButton';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassInput } from '../../components/glass/GlassInput';
import { useXP } from '../../context/XPContext';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

type Step = 'account' | 'personal' | 'profile';

export const RegisterScreen = ({ navigation }: any) => {
    const { theme, typography, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const setUser = useAuthStore((state) => state.setUser);
    const { showXP } = useXP();

    // Steps state
    const [currentStep, setCurrentStep] = useState<Step>('account');
    const [loading, setLoading] = useState(false);

    // Account Data
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');

    // Personal Data
    const [displayName, setDisplayName] = useState('');
    const [gender, setGender] = useState('');
    const [birthday, setBirthday] = useState(new Date(2000, 0, 1));
    const [city, setCity] = useState('');

    // Profile Data
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bio, setBio] = useState('');

    // Helpers
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState<Date>(birthday);

    const genders = ['Erkek', 'Kadın', 'Diğer', 'Belirtmek istemiyorum'];

    const validateUsername = async (u: string) => {
        if (!u || u.length < 3) return false;
        const q = query(collection(db, 'profiles'), where('username', '==', u.toLowerCase()));
        const snapshot = await getDocs(q);
        return snapshot.empty;
    };

    const formatBirthday = (date: Date) => {
        // Ensure we are working with the date at noon to avoid day shift due to timezones
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const handleNext = async () => {
        if (currentStep === 'account') {
            if (!username || !email || !password || !confirmPassword) {
                Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
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
            const isAvailable = await validateUsername(username);
            setLoading(false);

            if (!isAvailable) {
                Alert.alert('Hata', 'Bu kullanıcı adı zaten alınmış.');
                return;
            }
            setCurrentStep('personal');
        } else if (currentStep === 'personal') {
            if (!displayName || !gender || !city) {
                Alert.alert('Hata', 'Lütfen temel bilgileri doldurun.');
                return;
            }
            setCurrentStep('profile');
        }
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişim izni vermelisiniz.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setAvatarUrl(result.assets[0].uri);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            // 1. Create User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Set Firebase Auth Display Name
            await updateProfile(user, { displayName });

            // 3. Prepare Stats
            let initialXp = 0;
            let rewards = [];

            if (avatarUrl) {
                initialXp += 50;
                rewards.push({ amount: 50, msg: 'Profil Fotoğrafı Ödülü' });
            }
            if (bio.trim()) {
                initialXp += 25;
                rewards.push({ amount: 25, msg: 'Biyografi Ödülü' });
            }

            // 4. Save Profile
            await setDoc(doc(db, 'profiles', user.uid), {
                uid: user.uid,
                email,
                username: username.toLowerCase(),
                display_name: displayName,
                gender,
                birthday: formatBirthday(birthday),
                city,
                phone_number: phone,
                avatar_url: avatarUrl,
                bio,
                address: '',
                post_count: 0,
                followers: [],
                following: [],
                created_at: new Date().toISOString(),
                level: 1,
                xp: initialXp,
                xp_next_level: 150,
                intro_seen: false,
                is_avatar_rewarded: !!avatarUrl,
                is_bio_rewarded: !!bio.trim()
            });

            // 5. Trigger XP Toasts if earned
            rewards.forEach(r => {
                setTimeout(() => showXP(r.amount, r.msg), 1500);
            });

            Alert.alert('Başarılı', 'Hoş geldiniz! Hesabınız başarıyla oluşturuldu.');
            setUser(user);
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderAccountStep = () => (
        <MotiView from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing' }}>
            <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display }]}>Hesabını Oluştur</Text>
            <Text style={[styles.stepDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>Temel bilgilerinle başlayalım.</Text>

            <GlassCard style={styles.card}>
                <Text style={styles.label}>KULLANICI ADI</Text>
                <GlassInput value={username} onChangeText={t => setUsername(t.toLowerCase())} placeholder="neyesem_gurme" autoCapitalize="none" />

                <Text style={styles.label}>E-POSTA</Text>
                <GlassInput value={email} onChangeText={setEmail} placeholder="ornek@email.com" keyboardType="email-address" autoCapitalize="none" />

                <Text style={styles.label}>ŞİFRE</Text>
                <GlassInput value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry />

                <Text style={styles.label}>ŞİFRE TEKRAR</Text>
                <GlassInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••" secureTextEntry />

                <GlassButton title="İlerle" onPress={handleNext} loading={loading} style={{ marginTop: 24 }} trailingIcon={<ArrowRight size={18} color="#fff" />} />
            </GlassCard>
        </MotiView>
    );

    const renderPersonalStep = () => (
        <MotiView from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing' }}>
            <View style={styles.stepHeader}>
                <TouchableOpacity onPress={() => setCurrentStep('account')} style={styles.backBtn}>
                    <ArrowLeft size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display, flex: 1, marginLeft: 12 }]}>Kişisel Bilgiler</Text>
            </View>

            <GlassCard style={styles.card}>
                <Text style={styles.label}>AD SOYAD</Text>
                <GlassInput value={displayName} onChangeText={setDisplayName} placeholder="Halil İbrahim Ustagül" autoCapitalize="words" />

                <Text style={styles.label}>CİNSİYET</Text>
                <TouchableOpacity
                    style={[styles.selector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}
                    onPress={() => {
                        Alert.alert('Cinsiyet', '', genders.map(g => ({ text: g, onPress: () => setGender(g) })));
                    }}
                >
                    <Text style={{ color: gender ? theme.text : theme.secondaryText }}>{gender || 'Seçiniz'}</Text>
                    <ChevronDown size={18} color={theme.secondaryText} />
                </TouchableOpacity>

                <Text style={styles.label}>ŞEHİR (İL)</Text>
                <GlassInput value={city} onChangeText={setCity} placeholder="İstanbul" />

                <Text style={styles.label}>DOĞUM TARİHİ</Text>
                <TouchableOpacity
                    style={[styles.selector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }]}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={{ color: theme.text }}>{formatBirthday(birthday)}</Text>
                    <ChevronDown size={18} color={theme.secondaryText} />
                </TouchableOpacity>

                <GlassButton title="Son Adıma Geç" onPress={handleNext} style={{ marginTop: 24 }} trailingIcon={<ArrowRight size={18} color="#fff" />} />
            </GlassCard>
        </MotiView>
    );

    const renderProfileStep = () => (
        <MotiView from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing' }}>
            <View style={styles.stepHeader}>
                <TouchableOpacity onPress={() => setCurrentStep('personal')} style={styles.backBtn}>
                    <ArrowLeft size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display, flex: 1, marginLeft: 12 }]}>Profilini Parlat</Text>
            </View>
            <Text style={[styles.stepDesc, { color: theme.secondaryText, fontFamily: typography.body }]}>Bu adım isteğe bağlıdır ancak ödül kazandırır! ✨</Text>

            <GlassCard style={styles.card}>
                <View style={styles.rewardsRow}>
                    <View style={styles.rewardItem}>
                        <Check size={14} color={colors.mintFresh} />
                        <Text style={[styles.rewardText, { color: colors.mintFresh }]}>FOTO: +50XP</Text>
                    </View>
                    <View style={styles.rewardItem}>
                        <Check size={14} color={colors.mintFresh} />
                        <Text style={[styles.rewardText, { color: colors.mintFresh }]}>BİO: +25XP</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.avatarPicker} onPress={handlePickImage}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                            <Camera size={28} color={theme.secondaryText} />
                        </View>
                    )}
                    <View style={styles.plusCircle}>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>+</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.label}>BİYOGRAFİ</Text>
                <GlassInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Kendinden bahset (örn: En sevdiğim mutfak İtalyan!)"
                    multiline
                    numberOfLines={4}
                    containerStyle={styles.bioInputContainer}
                    style={styles.bioInput}
                />

                <GlassButton title="Kayıt Ol" onPress={handleFinish} loading={loading} style={{ marginTop: 24 }} />
                <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
                    <Text style={[styles.skipText, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>Daha sonra yap (Atla)</Text>
                </TouchableOpacity>
            </GlassCard>
        </MotiView>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBase, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                        <MotiView
                            animate={{ width: currentStep === 'account' ? '33%' : currentStep === 'personal' ? '66%' : '100%' }}
                            style={[styles.progressFill, { backgroundColor: colors.saffron }]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: theme.secondaryText }]}>Adım {currentStep === 'account' ? '1' : currentStep === 'personal' ? '2' : '3'}/3</Text>
                </View>

                {currentStep === 'account' && renderAccountStep()}
                {currentStep === 'personal' && renderPersonalStep()}
                {currentStep === 'profile' && renderProfileStep()}

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                    <Text style={[styles.loginText, { color: theme.secondaryText }]}>Zaten hesabın var mı? <Text style={{ color: colors.saffron, fontWeight: 'bold' }}>Giriş Yap</Text></Text>
                </TouchableOpacity>
            </ScrollView>

            {/* iOS Date Picker Modal */}
            {Platform.OS === 'ios' && showDatePicker && (
                <Modal transparent animationType="slide" visible={showDatePicker}>
                    <View style={styles.datePickerModal}>
                        <View style={[styles.datePickerContainer, { backgroundColor: theme.surface }]}>
                            <View style={styles.datePickerHeader}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={[styles.datePickerDoneText, { color: colors.saffron, fontFamily: typography.bodyMedium }]}>Tamam</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={birthday}
                                mode="date"
                                display="spinner"
                                textColor={theme.text}
                                onChange={(e, date) => {
                                    if (date) {
                                        const normalizedDate = new Date(date);
                                        normalizedDate.setHours(12, 0, 0, 0);
                                        setBirthday(normalizedDate);
                                    }
                                }}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {/* Android Date Picker */}
            {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                    value={birthday}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                        setShowDatePicker(false);
                        if (date) {
                            const normalizedDate = new Date(date);
                            normalizedDate.setHours(12, 0, 0, 0);
                            setBirthday(normalizedDate);
                        }
                    }}
                />
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: 60 },
    progressContainer: { marginBottom: 30 },
    progressBase: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 12, fontWeight: 'bold', textAlign: 'right' },
    stepTitle: { fontSize: 28, marginBottom: 8 },
    stepDesc: { fontSize: 16, marginBottom: 24, opacity: 0.8 },
    stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
    card: { padding: 20, borderRadius: 24 },
    label: { fontSize: 11, fontWeight: 'bold', color: colors.oliveMuted, marginTop: 16, marginBottom: 8, letterSpacing: 1 },
    selector: { height: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    rewardsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    rewardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(74, 189, 142, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    rewardText: { fontSize: 11, fontWeight: '900', marginLeft: 4 },
    avatarPicker: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 20, position: 'relative' },
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: colors.oliveMuted },
    plusCircle: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.saffron, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
    skipBtn: { marginTop: 16, alignItems: 'center' },
    skipText: { fontSize: 14, opacity: 0.7 },
    bioInputContainer: {
        height: 120,
    },
    bioInput: {
        height: '100%',
    },
    loginLink: { marginTop: 30, alignItems: 'center' },
    loginText: { fontSize: 14 },
    datePickerModal: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    datePickerContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    datePickerHeader: {
        padding: 16,
        alignItems: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    datePickerDoneText: {
        fontSize: 17,
        fontWeight: '600',
    },
});
