import * as ImagePicker from 'expo-image-picker';
import { collection, doc, getDoc, getDocs, increment, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { ArrowLeft, Camera, Image as LucideImage } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { GlassButton } from '../../components/glass/GlassButton';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassInput } from '../../components/glass/GlassInput';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const EditProfileScreen = ({ navigation }: any) => {
    const { theme, typography } = useTheme();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [phoneCode, setPhoneCode] = useState('+90');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [originalUsername, setOriginalUsername] = useState('');
    const [usernameChanges, setUsernameChanges] = useState<any[]>([]);
    const [isAvatarRewarded, setIsAvatarRewarded] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) {
            setPageLoading(false);
            return;
        }

        try {
            setPageLoading(true);
            const docSnap = await getDoc(doc(db, 'profiles', user.uid));

            if (docSnap.exists()) {
                const data = docSnap.data();
                setDisplayName(data.display_name || '');
                setUsername(data.username || '');
                setOriginalUsername(data.username || '');
                setBio(data.bio || '');
                setEmail(user.email || '');
                setAddress(data.address || '');
                setUsernameChanges(data.username_changes || []);
                setIsAvatarRewarded(data.is_avatar_rewarded || false);
                setAvatarUrl(data.avatar_url || '');

                const phone = data.phone_number || '';
                if (phone && phone.includes(' ')) {
                    const parts = phone.split(' ');
                    setPhoneCode(parts[0]);
                    setPhoneNumber(parts.slice(1).join(' '));
                } else {
                    setPhoneNumber(phone);
                }
            } else {
                // Profil belgesi yoksa başlangıç değerlerini kullan
                setEmail(user.email || '');
                setPhoneCode('+90');
            }
            setPageLoading(false);
        } catch (error: any) {
            console.error('Profil yüklenirken hata:', error);
            // Hata durumunda da kullanıcı ekrandan çıkmasın
            // En azından e-posta ve telefon kodu gösterilsin
            setEmail(user.email || '');
            setPhoneCode('+90');
            setPageLoading(false);
        }
    };

    const handleAvatarPick = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişim izni vermelisiniz.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setUploadingAvatar(true);
                const uri = result.assets[0].uri;

                // Upload to Cloudinary instead of Firebase Storage
                const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
                const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

                const formData = new FormData();
                formData.append('file', {
                    uri,
                    type: 'image/jpeg',
                    name: `avatar_${user?.uid}_${Date.now()}.jpg`,
                } as any);
                formData.append('upload_preset', uploadPreset || 'neyesem');
                formData.append('folder', 'avatars');

                const cloudinaryResponse = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    { method: 'POST', body: formData }
                );

                const cloudinaryData = await cloudinaryResponse.json();

                if (!cloudinaryData.secure_url) {
                    throw new Error('Cloudinary upload failed');
                }

                const downloadURL = cloudinaryData.secure_url;
                setAvatarUrl(downloadURL);

                // Update Firestore directly for immediate feedback
                if (user) {
                    await updateDoc(doc(db, 'profiles', user.uid), {
                        avatar_url: downloadURL,
                        updated_at: serverTimestamp(),
                    });
                }

                setUploadingAvatar(false);
                Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi!');
            }
        } catch (error: any) {
            console.error("Avatar upload error: ", error);
            Alert.alert("Hata", "Fotoğraf yüklenirken bir hata oluştu.");
            setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            if (username && username !== originalUsername) {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                const recentChanges = usernameChanges.filter((change: any) => {
                    const changeDate = change.toDate ? change.toDate() : new Date(change);
                    return changeDate > thirtyDaysAgo;
                });

                if (recentChanges.length >= 3) {
                    Alert.alert('Hata', 'Kullanıcı adını 30 gün içinde en fazla 3 kez değiştirebilirsin.');
                    setLoading(false);
                    return;
                }

                const userQuery = query(collection(db, 'profiles'), where('username', '==', username.toLowerCase()));
                const userSnap = await getDocs(userQuery);
                const isTakenByOther = userSnap.docs.some(doc => doc.id !== user.uid);

                if (isTakenByOther) {
                    Alert.alert('Hata', 'Bu kullanıcı adı zaten alınmış.');
                    setLoading(false);
                    return;
                }
            }

            const fullPhoneNumber = `${phoneCode} ${phoneNumber}`;

            if (phoneNumber && phoneNumber.trim() !== '') {
                const phoneQuery = query(collection(db, 'profiles'), where('phone_number', '==', fullPhoneNumber));
                const phoneSnap = await getDocs(phoneQuery);
                const isTakenByOther = phoneSnap.docs.some(doc => doc.id !== user.uid);

                if (isTakenByOther) {
                    Alert.alert('Hata', 'Bu telefon numarası başka bir hesaba tanımlı.');
                    setLoading(false);
                    return;
                }
            }

            const updateData: any = {
                display_name: displayName,
                bio: bio,
                phone_number: fullPhoneNumber,
                address: address,
                avatar_url: avatarUrl,
                updated_at: serverTimestamp(),
            };

            if (username !== originalUsername) {
                updateData.username = username.toLowerCase();
                updateData.username_changes = [...usernameChanges, new Date()];
            }

            if (avatarUrl && avatarUrl !== '' && !isAvatarRewarded) {
                updateData.xp = increment(50);
                updateData.credits = increment(200);
                updateData.is_avatar_rewarded = true;
                Alert.alert('Tebrikler!', 'Profil fotoğrafı yüklediğin için 50 XP kazandın!');
            }

            await updateDoc(doc(db, 'profiles', user.uid), updateData);
            Alert.alert('Başarılı', 'Profilin güncellendi!');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Hata', 'Profil güncellenemedi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={[{ color: theme.text, fontSize: 16 }]}>Profil yükleniyor...</Text>
            </View>
        );
    }

    const headerHeight = 52 + insets.top;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.glass }]}
                >
                    <ArrowLeft size={20} color={theme.text} />
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={headerHeight}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent]}
                    scrollIndicatorInsets={{ right: 1 }}
                    bounces={true}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[styles.pageTitle, { color: theme.text, fontFamily: typography.display }]}>
                        Kişisel Bilgiler
                    </Text>
                    <GlassCard style={styles.card}>
                        <View style={styles.avatarContainer}>
                            <TouchableOpacity onPress={handleAvatarPick} style={styles.avatarwrapper}>
                                {avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.glassBorder }]}>
                                        <LucideImage size={40} color={theme.secondaryText} />
                                    </View>
                                )}
                                <View style={[styles.cameraIconContainer, { backgroundColor: colors.saffron }]}>
                                    <Camera size={16} color="white" />
                                </View>
                            </TouchableOpacity>
                            <Text style={[styles.changePhotoText, { color: colors.saffron, fontFamily: typography.bodyMedium }]}>
                                {uploadingAvatar ? "Yükleniyor..." : (avatarUrl ? "Profil Fotoğrafını Değiştir" : "Profil Fotoğrafı Yükle")}
                            </Text>
                            {!isAvatarRewarded && !avatarUrl && (
                                <Text style={{ color: colors.mintFresh, fontSize: 12, marginTop: 4 }}>
                                    (+50 XP Kazan)
                                </Text>
                            )}
                        </View>

                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                            E-posta (Değiştirilemez)
                        </Text>
                        <GlassInput
                            value={email}
                            editable={false}
                            style={{ opacity: 0.5 }}
                        />

                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium, marginTop: 20 }]}>
                            Görünen İsim
                        </Text>
                        <GlassInput
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Adın Soyadın"
                        />

                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium, marginTop: 20 }]}>
                            Kullanıcı Adı (@)
                        </Text>
                        <GlassInput
                            value={username.toLowerCase()}
                            onChangeText={setUsername}
                            placeholder="kullaniciadi"
                            autoCapitalize="none"
                        />
                        <Text style={[styles.hint, { color: colors.oliveLight, opacity: 0.8 }]}>
                            30 günde en fazla 3 kez değiştirilebilir.
                        </Text>

                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium, marginTop: 20 }]}>
                            Telefon Numarası
                        </Text>
                        <View style={styles.phoneContainer}>
                            <GlassInput
                                value={phoneCode}
                                onChangeText={setPhoneCode}
                                placeholder="+90"
                                keyboardType="phone-pad"
                                containerStyle={{ width: 80, marginRight: 8 }}
                            />
                            <GlassInput
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="5xx xxx xx xx"
                                keyboardType="phone-pad"
                                containerStyle={{ flex: 1 }}
                            />
                        </View>

                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium, marginTop: 20 }]}>
                            Adres
                        </Text>
                        <GlassInput
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Şehir, Ülke veya Tam Adres"
                            multiline
                            numberOfLines={2}
                            style={{ height: 60, textAlignVertical: 'top' }}
                        />

                        <Text style={[styles.label, { color: theme.secondaryText, fontFamily: typography.bodyMedium, marginTop: 20 }]}>
                            Biyografi
                        </Text>
                        <GlassInput
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Kendinden bahset..."
                            multiline
                            numberOfLines={4}
                            style={{ height: 100, textAlignVertical: 'top' }}
                        />

                        <GlassButton
                            title={loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                            onPress={handleSave}
                            style={styles.saveButton}
                        />

                        <GlassButton
                            title="İptal"
                            variant="outline"
                            onPress={() => navigation.goBack()}
                            style={styles.cancelButton}
                        />
                    </GlassCard>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingBottom: 10,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageTitle: {
        fontSize: 28,
        paddingHorizontal: 4,
        marginBottom: 24,
    },
    card: {
        width: '100%',
        paddingVertical: 24,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    hint: {
        fontSize: 11,
        marginTop: 6,
        fontStyle: 'italic',
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveButton: {
        marginTop: 32,
    },
    cancelButton: {
        marginTop: 12,
        borderWidth: 0,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarwrapper: {
        position: 'relative',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    changePhotoText: {
        fontSize: 14,
        marginTop: 12,
        fontWeight: 'bold',
    },
});
