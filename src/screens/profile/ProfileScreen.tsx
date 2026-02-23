import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Camera, Settings, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { AnimatedLevelCard } from '../../components/level/AnimatedLevelCard';
import { useAuthStore } from '../../store/authStore';
import { useLevelStore } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const ProfileScreen = () => {
    const { theme, isDark, typography } = useTheme();
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const { level, xp, xpNextLevel, levelName, updateStats } = useLevelStore();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const headerHeight = 52 + insets.top;

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const unsubscribe = onSnapshot(
            doc(db, 'profiles', user.uid),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfile(data);
                    updateStats({
                        level: data.level || 1,
                        xp: data.xp || 0,
                        xp_next_level: data.xp_next_level || 100,
                    });
                }
                setLoading(false);
            },
            () => {
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [user, updateStats]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && user) {
            try {
                await updateDoc(doc(db, 'profiles', user.uid), {
                    avatar_url: result.assets[0].uri,
                });
            } catch {
                Alert.alert('Hata', 'Fotoğraf güncellenemedi.');
            }
        }
    };

    const handleSettingsPress = () => {
        const parentNav = navigation.getParent();
        if (parentNav) {
            parentNav.navigate('Settings');
            return;
        }
        navigation.navigate('Settings');
    };

    const posts = profile?.post_count || 0;
    const followers = profile?.followers_count || 0;
    const following = profile?.following_count || 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16 }]}
                showsVerticalScrollIndicator={false}
                bounces={true}
                alwaysBounceVertical={Platform.OS === 'ios'}
            >
                {/* Settings Button Row */}
                <View style={styles.topRow}>
                    <View style={styles.topRowSpacer} />
                    <TouchableOpacity
                        style={[styles.settingsButton, {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                            borderColor: theme.border,
                        }]}
                        onPress={handleSettingsPress}
                        activeOpacity={0.7}
                    >
                        <Settings size={20} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Avatar */}
                <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} activeOpacity={0.8}>
                    {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarFallback, {
                            borderColor: theme.border,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F4F1',
                        }]}>
                            <UserIcon color={colors.oliveMuted} size={36} />
                        </View>
                    )}
                    <View style={[styles.cameraBadge, { borderColor: theme.background }]}>
                        <Camera color={colors.warmWhite} size={11} />
                    </View>
                </TouchableOpacity>

                {/* Name */}
                <Text style={[styles.displayName, { color: theme.text, fontFamily: typography.display }]}>
                    {loading ? '...' : (profile?.display_name || 'Kullanıcı')}
                </Text>
                <Text style={[styles.username, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    {loading ? '...' : `@${profile?.username || 'kullanici'}`}
                </Text>

                {/* Stats */}
                <View style={[styles.statsRow, { borderColor: theme.border }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {posts}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Gönderi
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {followers}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Takipçi
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {following}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Takip
                        </Text>
                    </View>
                </View>

                {/* Bio */}
                <Text style={[styles.bio, { color: theme.secondaryText, fontFamily: typography.body }]}>
                    {profile?.bio || 'Henüz biyografi eklenmedi.'}
                </Text>

                {/* Level Card */}
                <AnimatedLevelCard
                    level={level}
                    xp={xp}
                    xpNext={xpNextLevel}
                    levelName={levelName}
                    streak={profile?.streak || 0}
                    weeklyXp={profile?.weekly_xp || 0}
                />

                {/* Empty State / Posts Section */}
                <View style={styles.postsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.display }]}>
                        Gönderiler
                    </Text>

                    {posts === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                                <UserIcon size={32} color={theme.secondaryText} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                Henüz gönderi yok
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                İlk tarifini paylaşmak için 'Oluştur' butonuna tıkla!
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.postsGrid}>
                            {/* Posts would go here */}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 8,
    },
    topRowSpacer: {
        flex: 1,
    },
    settingsButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        marginBottom: 12,
        alignSelf: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 44,
    },
    avatarFallback: {
        width: '100%',
        height: '100%',
        borderRadius: 44,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.saffron,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    displayName: {
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 2,
    },
    username: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 18,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
    },
    statSeparator: {
        width: 0.5,
        height: 28,
    },
    bio: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 16,
    },
    postsSection: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 16,
    },
    emptyState: {
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 13,
        textAlign: 'center',
        opacity: 0.7,
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
});
