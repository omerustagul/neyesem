import { doc, onSnapshot } from 'firebase/firestore';
import { Bell, ChevronRight, HeartPulse, HelpCircle, Lock, Palette, User, Archive } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { GlassCard } from '../../components/glass/GlassCard';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

type ItemProps = {
    icon: React.ComponentType<any>;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    withToggle?: boolean;
    toggleValue?: boolean;
    onToggleChange?: (v: boolean) => void;
};

const SettingsItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    withToggle,
    toggleValue,
    onToggleChange,
}: ItemProps) => {
    const { theme, typography } = useTheme();

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={withToggle}>
            <View style={[styles.itemRow, { borderColor: theme.border }]}>
                <View style={styles.itemLeft}>
                    <Icon size={20} color={colors.saffron} />
                    <View style={styles.itemText}>
                        <Text style={[styles.itemTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>{title}</Text>
                        {subtitle ? (
                            <Text style={[styles.itemSubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>{subtitle}</Text>
                        ) : null}
                    </View>
                </View>
                {withToggle ? (
                    <Switch
                        value={!!toggleValue}
                        onValueChange={onToggleChange}
                        thumbColor="#FFFFFF"
                        trackColor={{ false: '#E2E5E1', true: '#A9D4BE' }}
                    />
                ) : (
                    <ChevronRight size={18} color={theme.secondaryText} />
                )}
            </View>
        </TouchableOpacity>
    );
};

export const SettingsScreen = ({ navigation }: any) => {
    const { theme, typography } = useTheme();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();
    const headerHeight = 64 + insets.top;
    const [profile, setProfile] = useState<any>(null);
    const [lightMode, setLightMode] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
            if (docSnap.exists()) setProfile(docSnap.data());
        });
        return () => unsubscribe();
    }, [user]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: headerHeight + 12 }]}
                showsVerticalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                bounces={false}
            >
                <Text style={[styles.pageTitle, { color: theme.text, fontFamily: typography.display }]}>Ayarlar</Text>

                <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>Hesap</Text>
                <GlassCard style={styles.sectionCard}>
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
                        onPress={() => {}}
                    />
                </GlassCard>

                <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>İçerik</Text>
                <GlassCard style={styles.sectionCard}>
                    <SettingsItem
                        icon={HeartPulse}
                        title="Hareketlerin"
                        subtitle="Yorumlar, beğeniler ve etkileşimler"
                        onPress={() => {}}
                    />
                    <SettingsItem
                        icon={Archive}
                        title="Arşiv"
                        subtitle="Arşivlenen gönderiler ve eski hikayeler"
                        onPress={() => {}}
                    />
                </GlassCard>

                <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>Uygulama</Text>
                <GlassCard style={styles.sectionCard}>
                    <SettingsItem
                        icon={Palette}
                        title="Görünüm"
                        subtitle={lightMode ? 'Açık Mod Açık' : 'Koyu Mod Açık'}
                        withToggle
                        toggleValue={lightMode}
                        onToggleChange={setLightMode}
                    />
                    <SettingsItem
                        icon={Bell}
                        title="Bildirimler"
                        subtitle="Uygulama bildirimlerini yönet"
                        onPress={() => {}}
                    />
                </GlassCard>

                <GlassCard style={styles.sectionCard}>
                    <SettingsItem
                        icon={HelpCircle}
                        title="Yardım ve Destek"
                        onPress={() => {}}
                    />
                </GlassCard>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },
    pageTitle: {
        fontSize: 40,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 28,
        marginTop: 14,
        marginBottom: 10,
    },
    sectionCard: {
        borderRadius: 18,
        marginBottom: 16,
        overflow: 'hidden',
    },
    itemRow: {
        minHeight: 78,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
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
        fontSize: 24,
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: 14,
    },
});
