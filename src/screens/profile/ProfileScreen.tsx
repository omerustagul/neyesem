import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Camera, Settings, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { PalateProfile, subscribeToPalateProfile } from '../../api/palateService';
import { Post, subscribeToUserPosts } from '../../api/postService';
import { Story, subscribeToActiveStories } from '../../api/storyService';
import { SelectionOption, SelectionPopup } from '../../components/common/SelectionPopup';
import { AnimatedLevelCard } from '../../components/level/AnimatedLevelCard';
import { PalateCard } from '../../components/profile/PalateCard';
import { FollowListPopup } from '../../components/social/FollowListPopup';
import { StoryViewer } from '../../components/social/StoryViewer';
import { useAuthStore } from '../../store/authStore';
import { useLevelStore } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 32) / 3;

export const ProfileScreen = () => {
    const { theme, isDark, typography } = useTheme();
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const { level, xp, xpNextLevel, levelName, updateStats } = useLevelStore();
    const [profile, setProfile] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
    const [activeStories, setActiveStories] = useState<Story[]>([]);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [palate, setPalate] = useState<PalateProfile | null>(null);
    const insets = useSafeAreaInsets();
    const headerHeight = 52 + insets.top;

    const onRefresh = React.useCallback(() => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    }, []);

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
            () => setLoading(false)
        );

        const postsUnsubscribe = subscribeToUserPosts(user.uid, (posts) => {
            const sortedPosts = [...posts].sort((a, b) => {
                const dateA = a.created_at?.seconds || 0;
                const dateB = b.created_at?.seconds || 0;
                return dateB - dateA;
            });
            setUserPosts(sortedPosts);
        });

        const storiesUnsubscribe = subscribeToActiveStories([], user.uid, (stories) => {
            setActiveStories(stories);
        });

        const palateUnsubscribe = subscribeToPalateProfile(user.uid, setPalate);

        return () => {
            unsubscribe();
            postsUnsubscribe();
            storiesUnsubscribe();
            palateUnsubscribe();
        };
    }, [user, updateStats]);

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

    const posts = profile?.post_count || 0;
    const followers = profile?.followers_count || 0;
    const following = profile?.following_count || 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16 }]}
                showsVerticalScrollIndicator={false}
                bounces={true}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.saffron} />}
            >
                {/* Settings */}
                <View style={styles.topRow}>
                    <TouchableOpacity
                        style={[styles.settingsButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Settings size={20} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Avatar */}
                <TouchableOpacity
                    style={[
                        styles.avatarContainer,
                        activeStories.length > 0 && { borderColor: colors.saffron, borderWidth: 3, padding: 3 }
                    ]}
                    onPress={() => activeStories.length > 0 && setViewerVisible(true)}
                    onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setShowProfileMenu(true);
                    }}
                    activeOpacity={0.8}
                >
                    {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                    ) : (
                        <View style={[styles.avatarFallback, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F4F1' }]}>
                            <UserIcon color={colors.oliveMuted} size={36} />
                        </View>
                    )}
                    <View style={[styles.cameraBadge, { borderColor: theme.background }]}>
                        <Camera color={colors.warmWhite} size={11} />
                    </View>
                </TouchableOpacity>

                <Text style={[styles.displayName, { color: theme.text, fontFamily: typography.display }]}>{profile?.display_name || 'Kullanıcı'}</Text>
                <Text style={[styles.username, { color: theme.secondaryText, fontFamily: typography.body }]}>@{profile?.username || 'kullanici'}</Text>

                <View style={[styles.statsRow, { borderColor: theme.border }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>{posts}</Text>
                        <Text style={styles.statLabel}>Gönderi</Text>
                    </View>
                    <TouchableOpacity style={styles.statItem} onPress={() => setFollowListType('followers')}>
                        <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>{followers}</Text>
                        <Text style={styles.statLabel}>Takipçi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={() => setFollowListType('following')}>
                        <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>{following}</Text>
                        <Text style={styles.statLabel}>Takip</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.bio, { color: theme.secondaryText, fontFamily: typography.body }]}>{profile?.bio || 'Henüz biyografi eklenmedi.'}</Text>

                <PalateCard profile={palate} />

                <AnimatedLevelCard level={level} xp={xp} xpNext={xpNextLevel} levelName={levelName} streak={profile?.streak || 0} weeklyXp={profile?.weekly_xp || 0} />

                <View style={styles.postsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.display }]}>Gönderiler</Text>
                    {userPosts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <UserIcon size={32} color={theme.secondaryText} />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz gönderi yok</Text>
                        </View>
                    ) : (
                        <View style={styles.postsGrid}>
                            {userPosts.map(post => (
                                <TouchableOpacity
                                    key={post.id}
                                    style={styles.gridItem}
                                    onPress={() => navigation.navigate('Reels', { initialPostId: post.id })}
                                >
                                    <Image source={{ uri: post.thumbnail_url || post.content_url }} style={styles.gridImage} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {followListType && (
                <FollowListPopup
                    userIds={followListType === 'followers' ? (profile?.followers || []) : (profile?.following || [])}
                    title={followListType === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                    onClose={() => setFollowListType(null)}
                />
            )}

            <StoryViewer visible={viewerVisible} stories={activeStories} onClose={() => setViewerVisible(false)} />

            <SelectionPopup
                visible={showProfileMenu}
                title="Profil Fotoğrafı"
                onClose={() => setShowProfileMenu(false)}
                options={[
                    ...(activeStories.length > 0 ? [{
                        label: 'Hikayeyi İzle',
                        onPress: () => {
                            setShowProfileMenu(false);
                            setViewerVisible(true);
                        }
                    }] : []),
                    {
                        label: 'Fotoğrafı Değiştir',
                        onPress: () => {
                            setShowProfileMenu(false);
                            handlePickImage();
                        }
                    },
                    {
                        label: 'İptal',
                        type: 'cancel',
                        onPress: () => setShowProfileMenu(false)
                    }
                ] as SelectionOption[]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
    topRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
    settingsButton: { width: 36, height: 36, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    avatarContainer: { width: 88, height: 88, borderRadius: 44, marginBottom: 12, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 44 },
    avatarFallback: { width: '100%', height: '100%', borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.saffron, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    displayName: { fontSize: 22, textAlign: 'center', marginBottom: 2 },
    username: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, marginBottom: 10 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, marginBottom: 2 },
    statLabel: { fontSize: 12, color: '#666' },
    bio: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
    postsSection: { marginTop: 10 },
    sectionTitle: { fontSize: 18, marginBottom: 16 },
    emptyState: { borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 16, marginTop: 8 },
    postsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 },
    gridItem: { width: GRID_ITEM_SIZE, aspectRatio: 0.75, padding: 2 },
    gridImage: { width: '100%', height: '100%', borderRadius: 12 },
});
