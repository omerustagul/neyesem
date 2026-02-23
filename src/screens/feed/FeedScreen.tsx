import { doc, onSnapshot } from 'firebase/firestore';
import { ChefHat, Heart, MessageCircle, Plus, Share2, TrendingUp, User, Utensils } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { FlatList, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { Post, subscribeToFeedPosts } from '../../api/postService';
import { EmbedCard } from '../../components/feed/EmbedCard';
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
                {stories.map((story) => (
                    <TouchableOpacity key={story.id} style={styles.storyItem} activeOpacity={0.8}>
                        <View style={[
                            styles.storyRing,
                            story.isSelf
                                ? { borderColor: theme.border }
                                : { borderColor: colors.saffron },
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
                ))}
            </ScrollView>
        </View>
    );
};

// Post card component for text/image posts
const PostCard = ({ post }: { post: Post }) => {
    const { theme, typography, isDark } = useTheme();

    return (
        <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
        >
            <View style={[styles.postCard, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                borderColor: theme.border,
            }]}>
                {/* Post header */}
                <View style={styles.postHeader}>
                    <View style={[styles.postAvatar, { backgroundColor: `${colors.saffron}20` }]}>
                        <Text style={{ fontSize: 14 }}>
                            {post.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View style={styles.postHeaderText}>
                        <Text style={[styles.postUsername, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {post.display_name || post.username}
                        </Text>
                        <Text style={[styles.postTime, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            @{post.username}
                        </Text>
                    </View>
                </View>

                {/* Post content */}
                {post.caption && (
                    <Text style={[styles.postCaption, { color: theme.text, fontFamily: typography.body }]}>
                        {post.caption}
                    </Text>
                )}

                <View style={[styles.postStats, { borderTopColor: theme.border }]}>
                    <View style={styles.statItem}>
                        <Heart size={14} color={theme.secondaryText} />
                        <Text style={[styles.statLabel, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            {post.likes_count || 0}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <MessageCircle size={14} color={theme.secondaryText} />
                        <Text style={[styles.statLabel, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            {post.comments_count || 0}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Share2 size={14} color={theme.secondaryText} />
                        <Text style={[styles.statLabel, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            {post.shares_count || 0}
                        </Text>
                    </View>
                </View>
            </View>
        </MotiView>
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

    const { user } = useAuthStore();
    const { level, updateStats } = useLevelStore();
    const { showLevelUp } = useXP();

    useEffect(() => {
        if (!user) return;

        // Sync level store with remote profile data
        const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const oldLevel = getLevelStoreLevel(); // We'll handle level up trigger in the callback or here

                updateStats({
                    level: data.level || 1,
                    xp: data.xp || 0,
                    xp_next_level: data.xp_next_level || 150
                });
            }
        });

        // Subscribe to real-time feed posts
        setIsLoading(true);
        const unsubscribe = subscribeToFeedPosts((feedPosts) => {
            setPosts(feedPosts);
            setIsLoading(false);
        }, 30);

        return () => {
            unsubProfile();
            unsubscribe();
        };
    }, [user]);

    // Track level changes to show celebration
    const prevLevelRef = React.useRef(level);
    useEffect(() => {
        if (level > prevLevelRef.current) {
            const { levelName } = useLevelStore.getState();
            showLevelUp(level, levelName);
        }
        prevLevelRef.current = level;
    }, [level]);

    // Helper to get current level from store without subscribe
    const getLevelStoreLevel = () => useLevelStore.getState().level;

    const renderItem = ({ item }: { item: Post }) => {
        if (item.content_type === 'embed' && item.content_url) {
            return (
                <EmbedCard
                    url={item.content_url}
                    user={{ username: item.username, avatar_url: item.avatar_url }}
                    caption={item.caption}
                    likes={item.likes_count || 0}
                    comments={item.comments_count || 0}
                />
            );
        }
        return <PostCard post={item} />;
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
                    bounces={true}
                    alwaysBounceVertical={Platform.OS === 'ios'}
                />
            ) : (
                <View style={[styles.emptyWrapper, { paddingTop: headerHeight + 16 }]}>
                    <StoryBar />
                    <EmptyFeed />
                </View>
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
    // Post card
    postCard: {
        marginHorizontal: 16,
        marginBottom: 14,
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        paddingBottom: 8,
    },
    postAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    postHeaderText: {
        marginLeft: 10,
    },
    postUsername: {
        fontSize: 14,
    },
    postTime: {
        fontSize: 12,
    },
    postCaption: {
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 14,
        paddingBottom: 12,
    },
    postStats: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statLabel: {
        fontSize: 13,
    },
});
