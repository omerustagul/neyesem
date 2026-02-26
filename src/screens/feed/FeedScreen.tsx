import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { ChefHat, Plus, TrendingUp, Utensils } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Challenge, UserChallengeProgress, subscribeToGlobalChallenge, subscribeToUserChallengeProgress } from '../../api/challengeService';
import { db } from '../../api/firebase';
import { Post, subscribeToFollowedFeed, togglePostLike } from '../../api/postService';
import { Story, subscribeToActiveStories } from '../../api/storyService';
import { UserAvatar } from '../../components/common/UserAvatar';
import { ChallengeBanner } from '../../components/feed/ChallengeBanner';
import { VideoPostCard } from '../../components/feed/VideoPostCard';
import { CommentsPopup } from '../../components/social/CommentsPopup';
import { SavePopup } from '../../components/social/SavePopup';
import { StoryViewer } from '../../components/social/StoryViewer';
import { useXP } from '../../context/XPContext';
import { useAuthStore } from '../../store/authStore';
import { useLevelStore } from '../../store/levelStore';
import { useNavigationStore } from '../../store/navigationStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const StoryBar = ({ stories, onStoryPress }: { stories: Story[], onStoryPress: (userId: string) => void }) => {
    const { theme, typography, isDark } = useTheme();
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();

    const groupedStories = stories.reduce((acc: any, story) => {
        if (!acc[story.userId]) {
            acc[story.userId] = {
                userStories: [],
                hasUnseen: false,
                latestStory: story,
                userId: story.userId,
                username: story.username,
                avatarUrl: story.avatarUrl
            };
        }
        acc[story.userId].userStories.push(story);
        acc[story.userId].userStories.sort((a: any, b: any) =>
            (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );

        if ((story.createdAt?.seconds || 0) > (acc[story.userId].latestStory.createdAt?.seconds || 0)) {
            acc[story.userId].latestStory = story;
        }

        const isSeen = story.viewedBy?.includes(user?.uid || '');
        if (!isSeen && story.userId !== user?.uid) {
            acc[story.userId].hasUnseen = true;
        }

        return acc;
    }, {});

    const displayStories = Object.values(groupedStories)
        .filter((s: any) => s.userId !== user?.uid)
        .sort((a: any, b: any) => {
            if (a.hasUnseen && !b.hasUnseen) return -1;
            if (!a.hasUnseen && b.hasUnseen) return 1;
            return 0;
        });

    const hasSelfStory = stories.some(s => s.userId === user?.uid);

    return (
        <View style={styles.storyBar}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storyBarContent}
            >
                <TouchableOpacity
                    style={styles.storyItem}
                    activeOpacity={0.8}
                    onPress={() => {
                        if (hasSelfStory) {
                            onStoryPress(user?.uid || '');
                        } else {
                            navigation.navigate('CreateStory');
                        }
                    }}
                >
                    <View style={[
                        styles.storyRing,
                        { borderColor: hasSelfStory ? colors.saffron : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') },
                    ]}>
                        <UserAvatar userId={user?.uid || ''} size={60} style={styles.storyAvatar} />
                        {!hasSelfStory && (
                            <View style={[styles.plusIconContainer, { backgroundColor: colors.saffron, borderColor: isDark ? '#000' : '#fff' }]}>
                                <Plus size={12} color="#fff" strokeWidth={3} />
                            </View>
                        )}
                    </View>
                    <Text style={[styles.storyUsername, { color: theme.text, fontFamily: typography.body }]} numberOfLines={1}>
                        Sen
                    </Text>
                </TouchableOpacity>

                {displayStories.map((userData: any) => (
                    <TouchableOpacity
                        key={userData.userId}
                        style={styles.storyItem}
                        activeOpacity={0.8}
                        onPress={() => onStoryPress(userData.userId)}
                    >
                        <View style={[
                            styles.storyRing,
                            { borderColor: userData.hasUnseen ? colors.saffron : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') },
                        ]}>
                            <UserAvatar userId={userData.userId} size={60} style={styles.storyAvatar} />
                        </View>
                        <Text style={[styles.storyUsername, { color: theme.text, fontFamily: typography.body }]} numberOfLines={1}>
                            {userData.username}
                        </Text>
                    </TouchableOpacity>
                ))}
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
            <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.saffron}15` }]}>
                <ChefHat size={48} color={colors.saffron} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: typography.display }]}>Hoş Geldin!</Text>
            <Text style={[styles.emptySubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                Henüz akışında içerik yok. Keşfet sayfasından tarif ve mutfak içeriklerini keşfetmeye başla!
            </Text>
            <View style={styles.tipContainer}>
                <View style={[styles.tipCard, { backgroundColor: `${colors.saffron}10`, borderColor: theme.border }]}>
                    <TrendingUp size={18} color={colors.saffron} />
                    <Text style={[styles.tipText, { color: theme.secondaryText, fontFamily: typography.body }]}>Seviye atladıkça daha fazla içerik paylaşabilirsin</Text>
                </View>
                <View style={[styles.tipCard, { backgroundColor: `${colors.saffron}10`, borderColor: theme.border }]}>
                    <Utensils size={18} color={colors.saffron} />
                    <Text style={[styles.tipText, { color: theme.secondaryText, fontFamily: typography.body }]}>Video tariflerini kaydet ve liste oluştur</Text>
                </View>
            </View>
        </MotiView>
    );
};

export const FeedScreen = () => {
    const { theme, isDark, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const headerHeight = 52 + insets.top;
    const { user } = useAuthStore();
    const { activeTab } = useNavigationStore();
    const { level, updateStats } = useLevelStore();
    const { showLevelUp } = useXP();

    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [activeSavePostId, setActiveSavePostId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewableItems, setViewableItems] = useState<string[]>([]);
    const [followingList, setFollowingList] = useState<string[]>([]);
    // global refresh hook (defined for future use)
    const [activeStories, setActiveStories] = useState<Story[]>([]);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [initialStoryIndex, setInitialStoryIndex] = useState(0);
    const [viewerStories, setViewerStories] = useState<Story[]>([]);
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [challengeProgress, setChallengeProgress] = useState<UserChallengeProgress | null>(null);

    const seenPostIdsRef = React.useRef<Set<string>>(new Set());
    const [refreshSignal, setRefreshSignal] = useState(0);
    // Global refresh hook available for future use (not wired up yet)
    // const { register } = useGlobalRefresh();
    const [globalRefreshTick, setGlobalRefreshTick] = useState(0);
    const isPageActive = activeTab === 'Feed';

    useEffect(() => {
        if (!user) return;

        const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                updateStats({ level: data.level || 1, xp: data.xp || 0, xp_next_level: data.xp_next_level || 150 });
                setFollowingList(data.following || []);
            }
        });

        const unsubChallenge = subscribeToGlobalChallenge(setChallenge);
        const unsubProgress = subscribeToUserChallengeProgress(user.uid, setChallengeProgress);

        return () => {
            unsubProfile();
            unsubChallenge();
            unsubProgress();
        };
    }, [user, updateStats]);

    useEffect(() => {
        if (!user) return;

        const feedUserIds = [...followingList];
        if (user.uid && !feedUserIds.includes(user.uid)) feedUserIds.push(user.uid);

        const unsubscribe = subscribeToFollowedFeed(feedUserIds, (feedPosts) => {
            const sortedPosts = [...feedPosts].sort((a, b) => {
                const aSeen = seenPostIdsRef.current.has(a.id);
                const bSeen = seenPostIdsRef.current.has(b.id);
                if (!aSeen && bSeen) return -1;
                if (aSeen && !bSeen) return 1;
                return (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0);
            });
            setPosts(sortedPosts);
            setIsLoading(false);
            setIsRefreshing(false);
        }, 30);

        const storiesUnsubscribe = subscribeToActiveStories(followingList, user.uid, setActiveStories);

        return () => {
            unsubscribe();
            storiesUnsubscribe();
        };
    }, [user, followingList, refreshSignal]);

    const onRefresh = () => {
        console.log('Feed refresh triggered');
        setIsRefreshing(true);
        setRefreshSignal((r) => r + 1);
        setPosts(prev => [...prev].sort((a, b) => {
            const aSeen = seenPostIdsRef.current.has(a.id);
            const bSeen = seenPostIdsRef.current.has(b.id);
            if (!aSeen && bSeen) return -1;
            if (aSeen && !bSeen) return 1;
            return (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0);
        }));
        setTimeout(() => setIsRefreshing(false), 1500);
    };

    const _onViewableItemsChanged = React.useRef(({ viewableItems: vItems }: any) => {
        const ids = vItems.map((v: any) => v.item.id);
        setViewableItems(ids);
        ids.forEach((id: string) => seenPostIdsRef.current.add(id));
    }).current;

    const handleLike = async (postId: string) => {
        if (!user) return;
        try {
            await togglePostLike(postId, user.uid);
            const { addXP } = useLevelStore.getState();
            await addXP(user.uid, 2);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleStoryPress = (selectedUserId: string) => {
        const userStories = activeStories
            .filter(s => s.userId === selectedUserId)
            .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        if (userStories.length > 0) {
            setViewerStories(userStories);
            setInitialStoryIndex(0);
            setViewerVisible(true);
        }
    };

    const renderItem = ({ item }: { item: Post }) => {
        const isLiked = item.liked_by?.includes(user?.uid || '');
        const isVisible = viewableItems.includes(item.id);
        return (
            <VideoPostCard
                post={item}
                isLiked={isLiked}
                isVisible={isVisible && isPageActive}
                isMutedOverride={!!activeCommentPostId || !!activeSavePostId}
                onLike={() => handleLike(item.id)}
                onComment={() => setActiveCommentPostId(item.id)}
                onSave={() => setActiveSavePostId(item.id)}
                onShare={() => { }}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
            {isRefreshing && (
                <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', pointerEvents: 'none', zIndex: 9999 }]}>
                    <ActivityIndicator color={colors.saffron} />
                </View>
            )}
            {posts.length > 0 ? (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        <View>
                            <StoryBar stories={activeStories} onStoryPress={handleStoryPress} />
                            <ChallengeBanner challenge={challenge} progress={challengeProgress} userId={user?.uid || ''} />
                        </View>
                    }
                    contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 16 }]}
                    showsVerticalScrollIndicator={false}
                    onViewableItemsChanged={_onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.saffron} colors={[colors.saffron]} />
                    }
                    bounces={true}
                    alwaysBounceVertical={Platform.OS === 'ios'}
                />
            ) : (
                <View style={[styles.emptyWrapper, { paddingTop: headerHeight + 16 }]}>
                    <StoryBar stories={activeStories} onStoryPress={handleStoryPress} />
                    <ChallengeBanner challenge={challenge} progress={challengeProgress} userId={user?.uid || ''} />
                    <EmptyFeed />
                </View>
            )}

            {activeCommentPostId && <CommentsPopup postId={activeCommentPostId} onClose={() => setActiveCommentPostId(null)} />}
            {activeSavePostId && <SavePopup postId={activeSavePostId} onClose={() => setActiveSavePostId(null)} />}
            <StoryViewer visible={viewerVisible} stories={viewerStories} initialIndex={initialStoryIndex} onClose={() => setViewerVisible(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { paddingBottom: 100 },
    emptyWrapper: { flex: 1 },
    emptyContainer: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
    emptyIconContainer: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 24, marginBottom: 8 },
    emptySubtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 300, marginBottom: 32 },
    tipContainer: { width: '100%', gap: 12 },
    tipCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
    tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
    storyBar: { paddingVertical: 4 },
    storyBarContent: { paddingHorizontal: 12, gap: 16 },
    storyItem: { alignItems: 'center', width: 68 },
    storyRing: { width: 78, height: 78, borderRadius: 39, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    storyAvatar: { width: 68, height: 68, borderRadius: 34 },
    plusIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    storyUsername: { fontSize: 11, marginTop: 4 },
});
