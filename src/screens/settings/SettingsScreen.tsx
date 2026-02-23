import { doc, onSnapshot } from 'firebase/firestore';
import {
    Archive,
    ArrowLeft,
    Bell,
    ChevronRight,
    HeartPulse,
    HelpCircle,
    Lock,
    LogOut,
    Palette,
    User,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { GlassCard } from '../../components/glass/GlassCard';
import { useAuthStore } from '../../store/authStore';
import { ThemeMode, useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

type ItemProps = {
    icon: React.ComponentType<any>;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
};

const SettingsItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    danger,
}: ItemProps) => {
    const { theme, typography } = useTheme();

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.itemRow, { borderColor: theme.border }]}>
                <View style={styles.itemLeft}>
                    <Icon size={20} color={danger ? colors.spiceRed : colors.saffron} />
                    <View style={styles.itemText}>
                        <Text style={[styles.itemTitle, {
                            color: danger ? colors.spiceRed : theme.text,
                            fontFamily: typography.bodyMedium,
                        }]}>{title}</Text>
                        {subtitle ? (
                            <Text style={[styles.itemSubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>{subtitle}</Text>
                        ) : null}
                    </View>
                </View>
                {!danger && <ChevronRight size={18} color={theme.secondaryText} />}
            </View>
        </TouchableOpacity>
    );
};

export const SettingsScreen = ({ navigation }: any) => {
    const { theme, typography, isDark, themeMode, setThemeMode } = useTheme();
    const { user, signOut } = useAuthStore();
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
            if (docSnap.exists()) setProfile(docSnap.data());
        });
        return () => unsubscribe();
    }, [user]);

    const getThemeLabel = () => {
        switch (themeMode) {
            case 'light': return 'Açık Mod';
            case 'dark': return 'Koyu Mod';
            case 'system': return 'Sistem';
        }
    };

    const handleThemeSelect = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['İptal', 'Açık Mod', 'Koyu Mod', 'Sistem'],
                    cancelButtonIndex: 0,
                    userInterfaceStyle: isDark ? 'dark' : 'light',
                },
                (index) => {
                    const themes: (ThemeMode | null)[] = [null, 'light', 'dark', 'system'];
                    if (themes[index]) setThemeMode(themes[index]!);
                }
            );
        } else {
            Alert.alert('Tema Seç', 'Uygulama temasını seçin', [
                { text: 'Açık Mod', onPress: () => setThemeMode('light') },
                { text: 'Koyu Mod', onPress: () => setThemeMode('dark') },
                { text: 'Sistem', onPress: () => setThemeMode('system') },
                { text: 'İptal', style: 'cancel' },
            ]);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            'Çıkış Yap',
            'Çıkış yapmak istediğine emin misin?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Simple Top Header for Back Button */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.glass }]}
                >
                    <ArrowLeft size={20} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={true}
                alwaysBounceVertical={Platform.OS === 'ios'}
            >
                <Text style={[styles.largeTitle, { color: theme.text, fontFamily: typography.display }]}>
                    Ayarlar
                </Text>
                <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>Hesap</Text>
                <GlassCard style={styles.sectionCard} contentStyle={{ padding: 0 }}>
                    <SettingsItem
                        icon={User}
                        title="Kişisel Bilgiler"
                        subtitle={profile?.email || 'İsim, E-posta, Profil Resmi'}
                        onPress={() => navigation.navigate('EditProfile')}
                    />
                    <SettingsItem
                        icon={Lock}
                        title="Şifre ve Güvenlik"
                        subtitle="Şifre değiştirme işlemleri"
                        onPress={() => { }}
                    />
                </GlassCard>

                <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>İçerik</Text>
                <GlassCard style={styles.sectionCard} contentStyle={{ padding: 0 }}>
                    <SettingsItem
                        icon={HeartPulse}
                        title="Hareketlerin"
                        subtitle="Yorumlar, beğeniler ve etkileşimler"
                        onPress={() => { }}
                    />
                    <SettingsItem
                        icon={Archive}
                        title="Arşiv"
                        subtitle="Arşivlenen gönderiler ve eski hikayeler"
                        onPress={() => { }}
                    />
                </GlassCard>

                <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>Uygulama</Text>
                <GlassCard style={styles.sectionCard} contentStyle={{ padding: 0 }}>
                    <SettingsItem
                        icon={Palette}
                        title="Görünüm"
                        subtitle={getThemeLabel()}
                        onPress={handleThemeSelect}
                    />
                    <SettingsItem
                        icon={Bell}
                        title="Bildirimler"
                        subtitle="Uygulama bildirimlerini yönet"
                        onPress={() => { }}
                    />
                </GlassCard>

                <GlassCard style={styles.sectionCard} contentStyle={{ padding: 0 }}>
                    <SettingsItem
                        icon={HelpCircle}
                        title="Yardım ve Destek"
                        onPress={() => { }}
                    />
                </GlassCard>

                {/* Sign Out Section */}
                <View style={styles.signOutSection}>
                    <GlassCard style={styles.sectionCard} contentStyle={{ padding: 0 }}>
                        <SettingsItem
                            icon={LogOut}
                            title="Çıkış Yap"
                            onPress={handleSignOut}
                            danger
                        />
                    </GlassCard>
                </View>
            </ScrollView>
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
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
    },
    largeTitle: {
        fontSize: 32,
        marginBottom: 20,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 13,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 16,
        marginBottom: 8,
    },
    sectionCard: {
        borderRadius: 18,
        marginBottom: 8,
        overflow: 'hidden',
    },
    itemRow: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemText: {
        marginLeft: 12,
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: 13,
    },
    signOutSection: {
        marginTop: 20,
    },
});
