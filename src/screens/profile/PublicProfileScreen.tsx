import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Bell, Share2, UserCheck, User as UserIcon, UserPlus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Platform, RefreshControl, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { followUser, unfollowUser } from '../../api/followService';
import { getNotificationSettings } from '../../api/notificationService';
import { Post, subscribeToUserPosts } from '../../api/postService';
import { Story, subscribeToActiveStories } from '../../api/storyService';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import { VideoThumbnail } from '../../components/feed/VideoThumbnail';
import { AnimatedLevelCard } from '../../components/level/AnimatedLevelCard';
import { LevelBadge, getGoldUsernameColor } from '../../components/level/LevelBadge';
import { FollowListPopup } from '../../components/social/FollowListPopup';
import { NotificationSettingsPopup } from '../../components/social/NotificationSettingsPopup';
import { StoryViewer } from '../../components/social/StoryViewer';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 32) / 3;

export const PublicProfileScreen = () => {
    const { theme, isDark, typography } = useTheme();
    const { user: currentUser } = useAuthStore();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { userId } = route.params;

    const [profile, setProfile] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [optimisticFollow, setOptimisticFollow] = useState<boolean | null>(null);
    const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
    const [activeStories, setActiveStories] = useState<Story[]>([]);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState<any>(null);
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);

    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!userId) return;

        setLoading(true);
        const unsubscribe = onSnapshot(
            doc(db, 'profiles', userId),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfile(data);
                    if (currentUser) {
                        setIsFollowing(data.followers?.includes(currentUser.uid) || false);
                    }
                }
                setLoading(false);
            },
            () => setLoading(false)
        );

        const postsUnsubscribe = subscribeToUserPosts(userId, (posts) => {
            const sortedPosts = [...posts].sort((a, b) => {
                const dateA = a.created_at?.seconds || 0;
                const dateB = b.created_at?.seconds || 0;
                return dateB - dateA;
            });
            setUserPosts(sortedPosts);
        });

        const storiesUnsubscribe = subscribeToActiveStories([], userId, (stories) => {
            setActiveStories(stories);
        });

        return () => {
            unsubscribe();
            postsUnsubscribe();
            storiesUnsubscribe();
        };
    }, [userId, currentUser]);

    useEffect(() => {
        if (currentUser && userId) {
            fetchNotificationSettings();
        }
    }, [currentUser, userId]);

    const fetchNotificationSettings = async () => {
        if (!currentUser) return;
        const settings = await getNotificationSettings(currentUser.uid, userId);
        setNotificationSettings(settings);
    };

    const handleFollowToggle = async () => {
        if (!currentUser) {
            Alert.alert('Giriş Yap', 'Takip etmek için giriş yapmalısın.');
            return;
        }

        const currentFollowState = optimisticFollow !== null ? optimisticFollow : isFollowing;

        if (currentFollowState) {
            Alert.alert(
                'Takibi Bırak',
                `@${profile?.username} kullanıcısını takibi bırakmak istediğine emin misin?`,
                [
                    { text: 'Vazgeç', style: 'cancel' },
                    {
                        text: 'Takibi Bırak',
                        style: 'destructive',
                        onPress: async () => {
                            setOptimisticFollow(false);
                            try {
                                await unfollowUser(currentUser.uid, userId);
                                setTimeout(() => setOptimisticFollow(null), 500);
                            } catch (error) {
                                Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
                                setOptimisticFollow(null);
                            }
                        }
                    }
                ]
            );
        } else {
            setOptimisticFollow(true);
            try {
                await followUser(currentUser.uid, userId);
                setTimeout(() => setOptimisticFollow(null), 500);
            } catch (error) {
                Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
                setOptimisticFollow(null);
            }
        }
    };

    if (loading && !profile) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.secondaryText }}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={theme.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>@{profile?.username}</Text>
                <View style={{ width: 40 }} />
            </View>

            {isRefreshing && (
                <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', zIndex: 9999 }]}>
                    <ActivityIndicator color={colors.saffron} />
                </View>
            )}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 1000); }} tintColor={colors.saffron} />}
            >
                <View style={styles.profileInfo}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => activeStories.length > 0 ? setViewerVisible(true) : null}
                        style={[
                            styles.avatarContainer,
                            activeStories.length > 0 && { borderColor: colors.saffron, borderWidth: 3, padding: 3 }
                        ]}
                    >
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <View style={[styles.avatarFallback, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F4F1' }]}>
                                <UserIcon color={colors.oliveMuted} size={40} />
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.nameSection}>
                        <Text style={[styles.displayName, { color: getGoldUsernameColor(profile?.level || 1) || theme.text, fontFamily: typography.display }]}>
                            {profile?.display_name}
                        </Text>
                        <View style={styles.badgeRow}>
                            {(profile?.is_verified || profile?.level >= 10) && (
                                <VerificationBadge size={18} />
                            )}
                            {(profile?.level >= 5) && (
                                <LevelBadge level={profile.level} size={20} />
                            )}
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>{profile?.post_count || 0}</Text>
                            <Text style={styles.statLabel}>Gönderi</Text>
                        </View>
                        <TouchableOpacity style={styles.statItem} onPress={() => setFollowListType('followers')}>
                            <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>{profile?.followers_count || 0}</Text>
                            <Text style={styles.statLabel}>Takipçi</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statItem} onPress={() => setFollowListType('following')}>
                            <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>{profile?.following_count || 0}</Text>
                            <Text style={styles.statLabel}>Takip</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.bio, { color: theme.secondaryText, fontFamily: typography.body }]}>{profile?.bio || 'Biyografi yok.'}</Text>

                    {currentUser?.uid !== userId && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[
                                    styles.followButton,
                                    {
                                        backgroundColor: (optimisticFollow !== null ? optimisticFollow : isFollowing) ? colors.spiceRed : colors.saffron,
                                        borderColor: (optimisticFollow !== null ? optimisticFollow : isFollowing) ? colors.spiceRed : colors.saffron,
                                        borderWidth: 1
                                    }
                                ]}
                                onPress={handleFollowToggle}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    {(optimisticFollow !== null ? optimisticFollow : isFollowing) ? (
                                        <UserCheck size={18} color={colors.warmWhite} />
                                    ) : (
                                        <UserPlus size={18} color={colors.warmWhite} />
                                    )}
                                    <Text style={[styles.followButtonText, { color: colors.warmWhite, fontFamily: typography.bodyMedium }]}>
                                        {(optimisticFollow !== null ? optimisticFollow : isFollowing) ? 'Takibi Bırak' : 'Takip Et'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.squareButton, { borderColor: theme.border, borderWidth: 1 }]}
                                onPress={() => {
                                    Share.share({
                                        message: `neyesem'de @${profile?.username} kullanıcısına göz at!`,
                                        url: `https://neyesem.app/user/${userId}`
                                    });
                                }}
                            >
                                <Share2 size={20} color={theme.text} strokeWidth={2} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.squareButton, { borderColor: theme.border, borderWidth: 1 }]}
                                onPress={() => setShowNotificationPopup(true)}
                            >
                                <Bell
                                    size={20}
                                    color={notificationSettings?.posts || notificationSettings?.stories ? colors.saffron : theme.text}
                                    strokeWidth={notificationSettings?.posts || notificationSettings?.stories ? 3 : 2}
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={{ marginHorizontal: -16 }}>
                    <AnimatedLevelCard
                        level={profile?.level || 1}
                        xp={profile?.xp || 0}
                        xpNext={profile?.xp_next_level || 100}
                        levelName={profile?.level_name || 'Gurme'}
                        rank={profile?.rank || (profile?.level * 1234 % 1000) + 1} // Fallback for demo if rank not in DB
                        badges={['Mutfak Ustası', 'Tat Dedektifi']} // Mock badges for the redesign impact
                    />
                </View>

                <View style={styles.postsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.display }]}>Gönderiler</Text>
                    {userPosts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={{ color: theme.secondaryText }}>Henüz gönderi yok.</Text>
                        </View>
                    ) : (
                        <View style={styles.postsGrid}>
                            {userPosts.map(post => (
                                <TouchableOpacity key={post.id} style={styles.gridItem} onPress={() => navigation.navigate('Reels', { postId: post.id })}>
                                    <VideoThumbnail
                                        videoUri={post.content_url || ''}
                                        thumbnailUri={post.thumbnail_url}
                                        style={styles.gridImage}
                                        showPlayIcon={post.content_type === 'video' || post.content_type === 'embed' || !!post.content_url?.match(/\.(mp4|mov|m4v|m3u8)$/i)}
                                        views={post.views || 0}
                                    />
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

            <NotificationSettingsPopup
                isVisible={showNotificationPopup}
                onClose={() => setShowNotificationPopup(false)}
                targetUserId={userId}
                currentUserId={currentUser?.uid || ''}
                targetUsername={profile?.username || ''}
                onSettingsChanged={fetchNotificationSettings}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: Platform.OS === 'ios' ? 100 : 70, zIndex: 10 },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 16 },
    scrollContent: { paddingBottom: 40 },
    profileInfo: { alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
    avatarFallback: { width: '100%', height: '100%', borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
    displayName: { fontSize: 24, textAlign: 'center' },
    nameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 4, // Fine-tune vertical alignment with display name
    },
    statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: 20 },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18 },
    statLabel: { fontSize: 12, opacity: 0.7 },
    bio: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
    actionRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
        marginBottom: 24,
    },
    followButton: { flex: 1, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    squareButton: {
        width: 48,
        height: 48,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    followButtonText: { fontSize: 15 },
    postsSection: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: { fontSize: 18, marginBottom: 16 },
    postsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 },
    gridItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE * 1.7, padding: 3 },
    gridImage: { width: '100%', height: '100%', borderRadius: 16 },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
});
