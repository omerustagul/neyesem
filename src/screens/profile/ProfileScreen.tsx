import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Camera, Settings, User as UserIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { Post, subscribeToUserPosts } from '../../api/postService';
import { VideoThumbnail } from '../../components/feed/VideoThumbnail';
import { AnimatedLevelCard } from '../../components/level/AnimatedLevelCard';
import { FollowListPopup } from '../../components/social/FollowListPopup';
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
    const insets = useSafeAreaInsets();
    const headerHeight = 52 + insets.top;

    const onRefresh = React.useCallback(() => {
        setIsRefreshing(true);
        // Snapshot will update automatically, but we can force it or just delay
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
            () => {
                setLoading(false);
            }
        );

        const postsUnsubscribe = subscribeToUserPosts(user.uid, (posts) => {
            // Sort in memory to avoid composite index requirement
            const sortedPosts = [...posts].sort((a, b) => {
                const dateA = a.created_at?.seconds || 0;
                const dateB = b.created_at?.seconds || 0;
                return dateB - dateA;
            });
            setUserPosts(sortedPosts);
        });

        return () => {
            unsubscribe();
            postsUnsubscribe();
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

    const handleSettingsPress = () => {
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
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.saffron}
                        colors={[colors.saffron]}
                    />
                }
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
                    <TouchableOpacity style={styles.statItem} onPress={() => setFollowListType('followers')}>
                        <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {followers}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Takipçi
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statItem} onPress={() => setFollowListType('following')}>
                        <Text style={[styles.statValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {following}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Takip
                        </Text>
                    </TouchableOpacity>
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

                    {userPosts.length === 0 ? (
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
                            {userPosts.map((post) => {
                                return (
                                    <TouchableOpacity
                                        key={post.id}
                                        style={styles.gridItem}
                                        onPress={() => navigation.navigate('Reels', { postId: post.id })}
                                    >
                                        {post.content_type === 'video' && post.content_url ? (
                                            <VideoThumbnail
                                                videoUri={post.content_url}
                                                thumbnailUri={post.thumbnail_url}
                                                style={styles.gridImage}
                                            />
                                        ) : post.thumbnail_url || post.content_url ? (
                                            <View style={[styles.gridImage, { backgroundColor: colors.glassBorder }]}>
                                                <Image source={{ uri: post.thumbnail_url || post.content_url }} style={styles.gridImage} />
                                            </View>
                                        ) : (
                                            <View style={[styles.gridImage, { backgroundColor: colors.glassBorder }]} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
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
        borderRadius: 16,
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
        marginHorizontal: -2,
    },
    gridItem: {
        width: GRID_ITEM_SIZE,
        height: GRID_ITEM_SIZE * 1.33,
        padding: 2,
    },
    gridImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    videoBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
