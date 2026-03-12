import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Archive, ArrowLeft, Bookmark, ChefHat, Flag, Flame, Gauge, Heart, Info, Instagram, MessageCircle, MoreVertical, Music2, Pencil, Play, Share2, Timer, Trash2, User as UserIcon, UserMinus, Volume2, VolumeX } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { archivePost, deletePost, Post, subscribeToFeedPosts, togglePostLike } from '../../api/postService';
import { GradientText } from '../../components/common/GradientText';
import { SelectionPopup } from '../../components/common/SelectionPopup';
import { UserAvatar } from '../../components/common/UserAvatar';
import { CommentsPopup } from '../../components/social/CommentsPopup';
import { SavePopup } from '../../components/social/SavePopup';
import { useEmbed } from '../../hooks/useEmbed';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const ReelItem = ({ post, isActive, onComment, onSave, isScreenFocused, onEdit, onArchive, isPopupOpen, optimisticIsLiked, onLike }: { post: Post; isActive: boolean; onComment: () => void; onSave: () => void; isScreenFocused: boolean; onEdit: () => void; onArchive: () => void; isPopupOpen: boolean; optimisticIsLiked?: boolean; onLike: () => void }) => {
    const { theme, isDark, typography } = useTheme();
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const actualIsLiked = post.liked_by?.includes(user?.uid || '');
    const isLiked = optimisticIsLiked !== undefined ? optimisticIsLiked : actualIsLiked;
    const isSaved = post.saved_by?.includes(user?.uid || '');
    const isOwner = user?.uid === post.userId;
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [rate, setRate] = useState(1.0);
    const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
    const [showReadMoreButton, setShowReadMoreButton] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [isFoodExpanded, setIsFoodExpanded] = useState(false);

    const { embedHtml, nativeVideoUrl, platform, isLoading: isEmbedLoading } = useEmbed(post.content_url || '');

    // Reset states when not active
    useEffect(() => {
        if (!isActive) {
            setIsFoodExpanded(false);
            setIsCaptionExpanded(false);
        }
    }, [isActive]);

    // Initialize expo-video player
    const isVideo = post.content_type === 'video' || (!post.content_type && post.content_url?.match(/\.(mp4|mov|m4v|m3u8)$|firebase-storage/i)) || !!nativeVideoUrl;
    const player = useVideoPlayer(isVideo ? (nativeVideoUrl || post.content_url || '') : 'https://assets.mixkit.co/videos/preview/mixkit-transparent-water-in-slow-motion-44391-preview.mp4', (player: any) => {
        player.loop = true;
        player.muted = true; // start muted
        player.pause(); // ensure it starts paused
    });

    useEffect(() => {
        if (isActive && !isPaused && isScreenFocused && !isPopupOpen) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, isPaused, isScreenFocused, player, isPopupOpen]);

    useEffect(() => {
        // Mute when: not active, screen unfocused, or popup open
        player.muted = !isActive || !isScreenFocused || isMuted || isPopupOpen;
        player.playbackRate = rate;
    }, [isActive, isScreenFocused, isMuted, rate, player, isPopupOpen]);

    const handleTap = () => {
        setIsPaused(!isPaused);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Bu tarife göz at: ${post.caption}\n\nhttps://neyesem.app/post/${post.id}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleReport = () => {
        Alert.alert('Şikayet Et', 'Bu gönderiyi şikayet etmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Şikayet Et',
                style: 'destructive',
                onPress: () => {
                    Alert.alert('Teşekkürler', 'Geri bildiriminiz alındı ve incelenecek.');
                }
            }
        ]);
    };

    const handleUnfollow = async () => {
        Alert.alert('Takibi Bırak', `@${post.username} kullanıcısını takipten çıkarmak istiyor musunuz?`, [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Takipten Çıkar',
                style: 'destructive',
                onPress: async () => {
                    if (!user) return;
                    try {
                        const { unfollowUser } = require('../../api/followService');
                        await unfollowUser(user.uid, post.userId);
                        Alert.alert('Başarılı', 'Kullanıcı takipten çıkarıldı.');
                    } catch (error) {
                        Alert.alert('Hata', 'İşlem başarısız oldu.');
                    }
                }
            }
        ]);
    };

    const handleMorePress = () => {
        if (!user) return;
        setShowOptionsMenu(true);
    };

    // Sub-components for better maintainability (Redesign implementation)
    const TopBar = () => (
        <View style={[topBarStyles.container, { top: insets.top + 8 }]}>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={topBarStyles.iconBtn}
            >
                <View style={topBarStyles.btnBorder}>
                    <BlurView intensity={40} tint="dark" style={topBarStyles.blurBtn}>
                        <ArrowLeft size={24} color="#fff" />
                    </BlurView>
                </View>
            </TouchableOpacity>

            <View style={topBarStyles.rightGroup}>
                <TouchableOpacity
                    onPress={() => setIsMuted(!isMuted)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <View style={topBarStyles.btnBorder}>
                        <BlurView intensity={40} tint="dark" style={topBarStyles.blurBtn}>
                            {isMuted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
                        </BlurView>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleMorePress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <View style={topBarStyles.btnBorder}>
                        <BlurView intensity={40} tint="dark" style={topBarStyles.blurBtn}>
                            <MoreVertical size={20} color="#fff" />
                        </BlurView>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );

    const UserRow = () => (
        <View style={userRowStyles.row}>
            <TouchableOpacity
                style={userRowStyles.userGroup}
                onPress={() => navigation.navigate('PublicProfile', { userId: post.userId })}
                activeOpacity={0.75}
            >
                <UserAvatar userId={post.userId} size={30} style={userRowStyles.avatar} />
                <Text style={[userRowStyles.username, { fontFamily: typography.bodyMedium }]} numberOfLines={1}>
                    {post.username}
                </Text>
            </TouchableOpacity>

            {post.content_type === 'embed' && platform !== 'unknown' && (
                <View style={[
                    userRowStyles.platformChip,
                    { backgroundColor: platform === 'instagram' ? 'rgba(225,48,108,0.2)' : 'rgba(0,0,0,0.3)' }
                ]}
                >
                    {platform === 'instagram' ? <Instagram size={9} color="#E1306C" /> : <Music2 size={9} color="#fff" />}
                    <Text style={[userRowStyles.platformText, { color: platform === 'instagram' ? '#E1306C' : '#fff' }]}>
                        {platform === 'instagram' ? 'IG' : 'TT'}
                    </Text>
                </View>
            )}

            <View style={{ flex: 1 }} />

            {!isOwner && (
                <TouchableOpacity style={userRowStyles.followBtn} activeOpacity={0.8}>
                    <Text style={userRowStyles.followText}>Takip</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const CaptionRow = () => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => showReadMoreButton && setIsCaptionExpanded(!isCaptionExpanded)}
        >
            <Text
                style={[captionStyles.text, { fontFamily: typography.body }]}
                numberOfLines={isCaptionExpanded ? undefined : 2}
                onTextLayout={(e) => {
                    if (e.nativeEvent.lines.length > 2 && !showReadMoreButton && !isCaptionExpanded) {
                        setShowReadMoreButton(true);
                    }
                }}
            >
                {post.caption}
            </Text>
            {showReadMoreButton && !isCaptionExpanded && (
                <Text style={captionStyles.readMore}>devamını gör</Text>
            )}
        </TouchableOpacity>
    );

    const FoodPill = () => (
        <View>
            <TouchableOpacity
                style={foodStyles.pill}
                onPress={() => setIsFoodExpanded(!isFoodExpanded)}
                activeOpacity={0.8}
            >
                <View style={foodStyles.metrics}>
                    {!!post.cooking_time && (
                        <View style={foodStyles.metric}>
                            <Timer size={11} color="rgba(255,255,255,0.7)" />
                            <Text style={foodStyles.metricText}>{post.cooking_time}</Text>
                        </View>
                    )}
                    {!!post.difficulty && (
                        <View style={foodStyles.metric}>
                            <Gauge size={11} color="rgba(255,255,255,0.7)" />
                            <Text style={foodStyles.metricText}>{post.difficulty}</Text>
                        </View>
                    )}
                    {!!post.calories && (
                        <View style={foodStyles.metric}>
                            <Flame size={11} color="rgba(255,255,255,0.7)" />
                            <Text style={foodStyles.metricText}>{post.calories} kcal</Text>
                        </View>
                    )}
                    {!!post.protein && (
                        <View style={foodStyles.metric}>
                            <ChefHat size={11} color="rgba(255,255,255,0.7)" />
                            <Text style={foodStyles.metricText}>{post.protein}</Text>
                        </View>
                    )}
                </View>

                <View style={foodStyles.expandIcon}>
                    <Info size={12} color={colors.saffron} />
                </View>
            </TouchableOpacity>

            {isFoodExpanded && (
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={foodStyles.detailBtn}
                    onPress={() => navigation.navigate('FoodDetail', { post: post })}
                >
                    <ChefHat size={14} color={colors.saffron} />
                    <GradientText
                        colors={[colors.saffron, colors.spiceRed]}
                        style={foodStyles.detailBtnText}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                    >
                        Yemek Hakkında →
                    </GradientText>
                </TouchableOpacity>
            )}
        </View>
    );

    const ActionBar = () => (
        <View style={actionStyles.bar}>
            <TouchableOpacity
                style={actionStyles.btn}
                onPress={onLike}
                activeOpacity={0.75}
            >
                <Heart size={18} color={isLiked ? colors.spiceRed : 'rgba(255,255,255,0.9)'} fill={isLiked ? colors.spiceRed : 'transparent'} />
                <Text style={[actionStyles.count, isLiked && { color: colors.spiceRed }]}>{post.likes_count || 0}</Text>
            </TouchableOpacity>

            <View style={actionStyles.divider} />

            <TouchableOpacity style={actionStyles.btn} onPress={onComment} activeOpacity={0.75}>
                <MessageCircle size={18} color="rgba(255,255,255,0.9)" />
                <Text style={actionStyles.count}>{post.comments_count || 0}</Text>
            </TouchableOpacity>

            <View style={actionStyles.divider} />

            <TouchableOpacity style={actionStyles.btn} onPress={onSave} activeOpacity={0.75}>
                <Bookmark size={18} color={isSaved ? colors.saffron : 'rgba(255,255,255,0.9)'} fill={isSaved ? colors.saffron : 'transparent'} />
                <Text style={[actionStyles.count, isSaved && { color: colors.saffron }]}>{post.saves_count || 0}</Text>
            </TouchableOpacity>

            <View style={actionStyles.divider} />

            <TouchableOpacity style={actionStyles.btn} onPress={handleShare} activeOpacity={0.75}>
                <Share2 size={17} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
        </View>
    );

    const BottomPanel = () => (
        <View style={[panelStyles.container, { bottom: insets.bottom + -20 }]}>
            <BlurView intensity={40} tint="dark" style={panelStyles.glassPanel}>
                <UserRow />
                {!!post.caption && <CaptionRow />}
                {!!(post.cooking_time || post.difficulty || post.calories) && <FoodPill />}
                <ActionBar />
            </BlurView>
        </View>
    );

    return (
        <View style={styles.reelContainer}>
            {/* Video layer */}
            <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
                onPress={handleTap}
                onLongPress={() => setRate(2.0)}
                onPressOut={() => setRate(1.0)}
            >
                {post.content_type === 'embed' && !nativeVideoUrl ? (
                    <View style={styles.video}>
                        <WebView
                            originWhitelist={['*']}
                            source={{
                                html: `
                                    <html>
                                      <head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                        <style>
                                          body { 
                                            margin: 0; 
                                            padding: 0; 
                                            display: flex; 
                                            justify-content: center; 
                                            align-items: center; 
                                            background: #000; 
                                            height: 100vh; 
                                            width: 100vw; 
                                            overflow: hidden; 
                                          }
                                          .instagram-media, .tiktok-embed { 
                                            margin: 0 !important; 
                                            padding: 0 !important; 
                                            border: none !important;
                                            min-width: 100% !important;
                                            max-width: 100% !important;
                                          }
                                          .EmbedHeader, .EmbedFooter, .UserTag, .SocialContext { display: none !important; }
                                        </style>
                                      </head>
                                      <body>
                                        ${embedHtml}
                                        <script async src="https://www.instagram.com/embed.js"></script>
                                        <script async src="https://www.tiktok.com/embed.js"></script>
                                      </body>
                                    </html>
                                `
                            }}
                            style={{ backgroundColor: '#000' }}
                            scrollEnabled={false}
                        />
                        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleTap} />
                    </View>
                ) : (nativeVideoUrl || post.content_url) ? (
                    <VideoView
                        player={player}
                        style={styles.video}
                        contentFit="cover"
                        nativeControls={false}
                    />
                ) : (
                    <View style={[styles.video, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#fff' }}>Video Bulunamadı</Text>
                    </View>
                )}
            </TouchableOpacity>

            <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.72)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            {!!(rate === 2.0) && (
                <View style={styles.speedIndicator}>
                    <Text style={styles.speedText}>2x</Text>
                </View>
            )}

            {!!isPaused && (
                <View style={styles.pauseOverlay}>
                    <Play size={56} color="rgba(255,255,255,0.35)" fill="rgba(255,255,255,0.15)" />
                </View>
            )}

            <TopBar />
            <BottomPanel />

            <SelectionPopup
                visible={showOptionsMenu}
                title="Gönderi Seçenekleri"
                onClose={() => setShowOptionsMenu(false)}
                options={isOwner ? [
                    {
                        label: 'Düzenle',
                        icon: <Pencil size={18} color={isDark ? '#F5F5F5' : '#1A1A1A'} />,
                        onPress: () => {
                            setShowOptionsMenu(false);
                            onEdit();
                        },
                    },
                    {
                        label: 'Arşivle',
                        icon: <Archive size={18} color={isDark ? '#F5F5F5' : '#1A1A1A'} />,
                        onPress: () => {
                            setShowOptionsMenu(false);
                            onArchive();
                        },
                    },
                    {
                        label: 'Sil',
                        icon: <Trash2 size={18} color={colors.spiceRed} />,
                        type: 'destructive',
                        onPress: () => {
                            setShowOptionsMenu(false);
                            Alert.alert('Sil', 'Bu gönderiyi silmek istediğine emin misin?', [
                                { text: 'Vazgeç', style: 'cancel' },
                                { text: 'Sil', style: 'destructive', onPress: () => deletePost(post.id, post.userId) },
                            ]);
                        },
                    },
                    { label: 'İptal', type: 'cancel', onPress: () => setShowOptionsMenu(false) },
                ] : [
                    {
                        label: 'Profilini Gör',
                        icon: <UserIcon size={18} color={theme.text} />,
                        onPress: () => {
                            setShowOptionsMenu(false);
                            navigation.navigate('PublicProfile', { userId: post.userId });
                        }
                    },
                    {
                        label: 'Takibi Bırak',
                        icon: <UserMinus size={18} color={colors.spiceRed} />,
                        type: 'destructive',
                        onPress: () => {
                            setShowOptionsMenu(false);
                            handleUnfollow();
                        }
                    },
                    {
                        label: 'Bu gönderiyi neden görüyorsun?',
                        icon: <Info size={18} color={theme.text} />,
                        onPress: () => {
                            setShowOptionsMenu(false);
                            Alert.alert('Neden Görüyorsun?', 'Bu gönderi takip ettiğiniz veya ilgi alanlarınıza uyan hesaplara dayanarak gösterilmektedir.');
                        }
                    },
                    {
                        label: 'Şikayet Et',
                        icon: <Flag size={18} color={colors.spiceRed} />,
                        type: 'destructive',
                        onPress: () => {
                            setShowOptionsMenu(false);
                            handleReport();
                        }
                    },
                    { label: 'İptal', type: 'cancel', onPress: () => setShowOptionsMenu(false) }
                ]}
            />
        </View>
    );
};

export const ReelsScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [activeSavePostId, setActiveSavePostId] = useState<string | null>(null);
    const [focusCommentId, setFocusCommentId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
    // Optimistic updates
    const [optimisticLikes, setOptimisticLikes] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const unsubscribe = subscribeToFeedPosts((fetchedPosts) => {
            const videoPosts = fetchedPosts.filter(p =>
                p.content_type === 'video' ||
                p.content_type === 'embed' ||
                (!p.content_type && p.content_url?.match(/\.(mp4|mov|m4v|m3u8)$|firebase-storage/i))
            );
            setPosts(videoPosts);

            const targetId = route.params?.initialPostId || route.params?.postId;
            if (targetId && !isInitialScrollDone) {
                const index = videoPosts.findIndex(p => p.id === targetId);
                if (index !== -1) {
                    setActiveIndex(index);
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index, animated: false });
                    }, 100);

                    if (route.params?.openComments) {
                        setTimeout(() => {
                            setActiveCommentPostId(targetId);
                            setFocusCommentId(route.params?.focusCommentId || null);
                        }, 400);
                    }
                }
                setIsInitialScrollDone(true);
            }
        });
        return () => unsubscribe();
    }, [route.params]);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    const handleLike = async (postId: string, userId: string) => {
        if (!userId) return;

        // Optimistic update
        const currentPost = posts.find(p => p.id === postId);
        const currentLikeState = optimisticLikes[postId] !== undefined
            ? optimisticLikes[postId]
            : currentPost?.liked_by?.includes(userId);
        const newLikeState = !currentLikeState;
        setOptimisticLikes(prev => ({ ...prev, [postId]: newLikeState }));

        try {
            await togglePostLike(postId, userId);
            // Clear optimistic state after successful update
            setTimeout(() => {
                setOptimisticLikes(prev => {
                    const newState = { ...prev };
                    delete newState[postId];
                    return newState;
                });
            }, 500);
        } catch (error) {
            console.error('Error liking post:', error);
            // Revert optimistic update on error
            setOptimisticLikes(prev => {
                const newState = { ...prev };
                delete newState[postId];
                return newState;
            });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {!!(posts.length > 0) && (
                <FlatList
                    ref={flatListRef}
                    data={posts}
                    renderItem={({ item, index }) => (
                        <ReelItem
                            post={item}
                            isActive={index === activeIndex}
                            isScreenFocused={isFocused}
                            isPopupOpen={!!activeCommentPostId || !!activeSavePostId}
                            onComment={() => setActiveCommentPostId(item.id)}
                            onSave={() => setActiveSavePostId(item.id)}
                            onEdit={() => (navigation as any).navigate('EditPost', { post: item })}
                            onArchive={() => {
                                archivePost(item.id);
                                Alert.alert('Arşivlendi', 'Gönderi arşive taşındı.');
                            }}
                            optimisticIsLiked={optimisticLikes[item.id]}
                            onLike={() => handleLike(item.id, item.userId)}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    initialScrollIndex={0}
                    getItemLayout={(data, index) => ({
                        length: height,
                        offset: height * index,
                        index,
                    })}
                />
            )}

            {!!activeCommentPostId && (
                <CommentsPopup
                    postId={activeCommentPostId}
                    onClose={() => {
                        setActiveCommentPostId(null);
                        setFocusCommentId(null);
                    }}
                    focusCommentId={focusCommentId}
                />
            )}

            {!!activeSavePostId && (
                <SavePopup
                    postId={activeSavePostId}
                    onClose={() => setActiveSavePostId(null)}
                />
            )}
        </View>
    );
};

const topBarStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    rightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBtn: {
        // Wrapper for hitSlop
    },
    btnBorder: {
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        overflow: 'hidden',
    },
    blurBtn: {
        width: 38,
        height: 38,
        backgroundColor: 'rgba(20,18,14,0.025)',
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});

const panelStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 12,
        right: 12,
    },
    glassPanel: {
        borderRadius: 38,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        padding: 16,
        gap: 8,
        backgroundColor: 'rgba(20,18,14,0.025)',
    },
});

const userRowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    userGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        flexShrink: 1,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    username: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        maxWidth: width * 0.38,
    },
    platformChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    platformText: {
        fontSize: 9,
        fontWeight: '700',
    },
    followBtn: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    followText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
});

const captionStyles = StyleSheet.create({
    text: {
        color: 'rgba(255,255,255,0.88)',
        fontSize: 13,
        lineHeight: 18,
    },
    readMore: {
        color: colors.saffron,
        fontSize: 12,
        marginTop: 2,
        fontWeight: '600',
    },
});

const foodStyles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(244,164,24,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(244,164,24,0.20)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    metrics: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metricText: {
        color: 'rgba(255,255,255,0.80)',
        fontSize: 11,
        fontWeight: '600',
    },
    expandIcon: {
        marginLeft: 8,
    },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 6,
        backgroundColor: 'rgba(244,164,24,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(244,164,24,0.25)',
        paddingVertical: 7,
        borderRadius: 10,
    },
    detailBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },
});

const actionStyles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingTop: 8,
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 4,
    },
    count: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    reelContainer: {
        width: width,
        height: height,
    },
    video: {
        width: width,
        height: height,
        position: 'absolute',
    },
    speedIndicator: {
        position: 'absolute',
        top: 100,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    speedText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
});
