import { doc, onSnapshot } from 'firebase/firestore';
import { ChefHat, Plus, TrendingUp, User, Utensils } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { FlatList, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { Post, subscribeToFollowedFeed, togglePostLike } from '../../api/postService';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { CommentsPopup } from '../../components/social/CommentsPopup';
import { SavePopup } from '../../components/social/SavePopup';
import { useXP } from '../../context/XPContext';
import { useAuthStore } from '../../store/authStore';
import { useLevelStore } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

// Story bar placeholder component
const StoryBar = () => {
    const { theme, typography, isDark } = useTheme();
    const { user } = useAuthStore();

    const stories = [
        { id: 'self', username: 'Sen', isSelf: true },
        // Real stories will come from Firebase later
    ];

    return (
        <View style={styles.storyBar}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storyBarContent}
            >
                {stories.map((story) => {
                    const isNew = true; // Placeholder for logic
                    return (
                        <TouchableOpacity
                            key={story.id}
                            style={styles.storyItem}
                            activeOpacity={0.8}
                            onPress={() => {
                                if (story.isSelf) {
                                    // Navigate to Story creation/view
                                    const navigation = (global as any).navigation;
                                    navigation?.navigate('Create');
                                }
                            }}
                        >
                            <View style={[
                                styles.storyRing,
                                { borderColor: story.isSelf ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : (isNew ? colors.saffron : 'rgba(0,0,0,0.2)') },
                            ]}>
                                <View style={[styles.storyAvatar, {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                }]}>
                                    {story.isSelf ? (
                                        <Plus size={20} color={colors.saffron} />
                                    ) : (
                                        <User size={20} color={theme.secondaryText} />
                                    )}
                                </View>
                            </View>
                            <Text
                                style={[styles.storyUsername, { color: theme.text, fontFamily: typography.body }]}
                                numberOfLines={1}
                            >
                                {story.username}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const EmptyFeed = () => {
    const { theme, typography } = useTheme();

    return (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            style={styles.emptyContainer}
        >
            <View style={[styles.emptyIconContainer, {
                backgroundColor: `${colors.saffron}15`,
            }]}>
                <ChefHat size={48} color={colors.saffron} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: typography.display }]}>
                Hoş Geldin!
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                Henüz akışında içerik yok. Keşfet sayfasından tarif ve mutfak içeriklerini keşfetmeye başla!
            </Text>

            <View style={styles.tipContainer}>
                <View style={[styles.tipCard, { backgroundColor: `${colors.saffron}10`, borderColor: theme.border }]}>
                    <TrendingUp size={18} color={colors.saffron} />
                    <Text style={[styles.tipText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Seviye atladıkça daha fazla içerik paylaşabilirsin
                    </Text>
                </View>
                <View style={[styles.tipCard, { backgroundColor: `${colors.saffron}10`, borderColor: theme.border }]}>
                    <Utensils size={18} color={colors.saffron} />
                    <Text style={[styles.tipText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Video tariflerini kaydet ve liste oluştur
                    </Text>
                </View>
            </View>
        </MotiView>
    );
};

export const FeedScreen = () => {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const headerHeight = 52 + insets.top;

    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Popup states
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [activeSavePostId, setActiveSavePostId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewableItems, setViewableItems] = useState<string[]>([]);

    const { user } = useAuthStore();
    const { level, updateStats } = useLevelStore();
    const { showLevelUp } = useXP();

    const [followingList, setFollowingList] = useState<string[]>([]);

    useEffect(() => {
        if (!user) return;

        // Listen to profile for following list and level sync
        const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                updateStats({
                    level: data.level || 1,
                    xp: data.xp || 0,
                    xp_next_level: data.xp_next_level || 150
                });
                setFollowingList(data.following || []);
            }
        });

        return () => unsubProfile();
    }, [user]);

    useEffect(() => {
        if (!user) return;

        // Subscribe to feed based on following list + own posts
        const feedUserIds = [...followingList];
        if (user.uid && !feedUserIds.includes(user.uid)) {
            feedUserIds.push(user.uid);
        }

        const unsubscribe = subscribeToFollowedFeed(feedUserIds, (feedPosts) => {
            setPosts(feedPosts);
            setIsLoading(false);
            setIsRefreshing(false);
        }, 30);

        return () => unsubscribe();
    }, [user, followingList]);

    const onRefresh = () => {
        setIsRefreshing(true);
        // The subscription will automatically update, just reset refresh state after a delay
        setTimeout(() => setIsRefreshing(false), 1500);
    };

    const _onViewableItemsChanged = React.useRef(({ viewableItems: vItems }: any) => {
        setViewableItems(vItems.map((v: any) => v.item.id));
    }).current;

    // Track level changes to show celebration
    const prevLevelRef = React.useRef(level);
    useEffect(() => {
        if (level > prevLevelRef.current) {
            const { levelName } = useLevelStore.getState();
            showLevelUp(level, levelName);
        }
        prevLevelRef.current = level;
    }, [level]);

    const handleLike = async (postId: string) => {
        if (!user) return;
        try {
            await togglePostLike(postId, user.uid);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const renderItem = ({ item, index }: { item: Post; index: number }) => {
        const isLiked = item.liked_by?.includes(user?.uid || '');
        const isVisible = viewableItems.includes(item.id);

        return (
            <VideoPostCard
                post={item}
                isLiked={isLiked}
                isVisible={isVisible}
                isMutedOverride={!!activeCommentPostId || !!activeSavePostId}
                onLike={() => handleLike(item.id)}
                onComment={() => setActiveCommentPostId(item.id)}
                onSave={() => setActiveSavePostId(item.id)}
                onShare={() => { }}
            />
        );
    };

    const hasContent = posts.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            {hasContent ? (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListHeaderComponent={<StoryBar />}
                    contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 16 }]}
                    showsVerticalScrollIndicator={false}
                    onViewableItemsChanged={_onViewableItemsChanged}
                    viewabilityConfig={{
                        itemVisiblePercentThreshold: 50
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.saffron}
                            colors={[colors.saffron]}
                        />
                    }
                    bounces={true}
                    alwaysBounceVertical={Platform.OS === 'ios'}
                />
            ) : (
                <View style={[styles.emptyWrapper, { paddingTop: headerHeight + 16 }]}>
                    <StoryBar />
                    <EmptyFeed />
                </View>
            )}

            {/* Popups */}
            {activeCommentPostId && (
                <CommentsPopup
                    postId={activeCommentPostId}
                    onClose={() => setActiveCommentPostId(null)}
                />
            )}

            {activeSavePostId && (
                <SavePopup
                    postId={activeSavePostId}
                    onClose={() => setActiveSavePostId(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 100,
        paddingHorizontal: 0,
    },
    emptyWrapper: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        maxWidth: 300,
        marginBottom: 32,
    },
    tipContainer: {
        width: '100%',
        gap: 12,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    // Story bar
    storyBar: {
        paddingVertical: 10,
    },
    storyBarContent: {
        paddingHorizontal: 16,
        gap: 16,
    },
    storyItem: {
        alignItems: 'center',
        width: 68,
    },
    storyRing: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    storyAvatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
    },
    storyUsername: {
        fontSize: 11,
        marginTop: 4,
    },
});
