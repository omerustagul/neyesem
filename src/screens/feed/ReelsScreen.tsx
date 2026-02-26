import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Archive, ArrowLeft, Bookmark, Flame, Gauge, Heart, Instagram, MessageCircle, MoreVertical, Music2, Pencil, Play, Timer, Trash2, Volume2, VolumeX } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { archivePost, deletePost, Post, subscribeToFeedPosts, togglePostLike } from '../../api/postService';
import { SelectionPopup } from '../../components/common/SelectionPopup';
import { UserAvatar } from '../../components/common/UserAvatar';
import { CommentsPopup } from '../../components/social/CommentsPopup';
import { SavePopup } from '../../components/social/SavePopup';
import { useEmbed } from '../../hooks/useEmbed';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const ReelItem = ({ post, isActive, onComment, onSave, isScreenFocused, onEdit, onArchive }: { post: Post; isActive: boolean; onComment: () => void; onSave: () => void; isScreenFocused: boolean; onEdit: () => void; onArchive: () => void }) => {
    const { theme, isDark, typography } = useTheme();
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const isLiked = post.liked_by?.includes(user?.uid || '');
    const isSaved = post.saved_by?.includes(user?.uid || '');
    const isOwner = user?.uid === post.userId;
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [rate, setRate] = useState(1.0);
    const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

    // Initialize expo-video player
    const player = useVideoPlayer(post.content_url && post.content_url.length > 0 ? post.content_url : 'https://assets.mixkit.co/videos/preview/mixkit-transparent-water-in-slow-motion-44391-preview.mp4', (player: any) => {
        player.loop = true;
    });

    useEffect(() => {
        if (isActive && !isPaused && isScreenFocused) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, isPaused, isScreenFocused, player]);

    useEffect(() => {
        player.muted = !isScreenFocused || isMuted;
        player.playbackRate = rate;
    }, [isScreenFocused, isMuted, rate, player]);

    const handleTap = () => {
        setIsPaused(!isPaused);
    };

    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    const handleMorePress = () => {
        if (!isOwner) return;
        setShowOptionsMenu(true);
    };

    const { embedHtml, platform, isLoading: isEmbedLoading } = useEmbed(post.content_url || '');

    const PlatformBadge = ({ platform }: { platform: string }) => {
        if (platform === 'unknown') return null;
        const isInstagram = platform === 'instagram';
        return (
            <View style={[styles.platformBadge, { backgroundColor: isInstagram ? '#E1306C40' : 'rgba(0,0,0,0.4)' }]}>
                {isInstagram ? <Instagram size={10} color="#E1306C" /> : <Music2 size={10} color="#fff" />}
                <Text style={[styles.platformText, { color: isInstagram ? '#E1306C' : '#fff' }]}>
                    {isInstagram ? 'Instagram' : 'TikTok'}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.reelContainer}>
            <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
                onPress={handleTap}
                onLongPress={() => setRate(2.0)}
                onPressOut={() => setRate(1.0)}
            >
                {post.content_type === 'embed' ? (
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
                                          /* Hide non-media elements in embeds as much as possible */
                                          .instagram-media, .tiktok-embed { 
                                            margin: 0 !important; 
                                            padding: 0 !important; 
                                            border: none !important;
                                            min-width: 100% !important;
                                            max-width: 100% !important;
                                          }
                                          /* Targeted CSS for Instagram/TikTok elements to focus on media */
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
                ) : post.content_url ? (
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

            {!!(rate === 2.0) && (
                <View style={styles.speedIndicator}>
                    <Text style={styles.speedText}>2x</Text>
                </View>
            )}

            {!!isPaused && (
                <View style={styles.pauseOverlay}>
                    <Play size={64} color="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.2)" />
                </View>
            )}

            {/* Overlay Gradient/Shadow (Simplified) */}
            <View style={styles.overlay}>
                {/* Right Actions */}
                <View style={styles.rightActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => togglePostLike(post.id, user?.uid || '')}>
                        <Heart size={32} color={isLiked ? colors.spiceRed : '#fff'} fill={isLiked ? colors.spiceRed : 'transparent'} />
                        <Text style={styles.actionText}>{post.likes_count || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
                        <MessageCircle size={32} color="#fff" />
                        <Text style={styles.actionText}>{post.comments_count || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={onSave}>
                        <Bookmark size={30} color={isSaved ? colors.saffron : '#fff'} fill={isSaved ? colors.saffron : 'transparent'} />
                        <Text style={styles.actionText}>{post.saves_count || 0}</Text>
                    </TouchableOpacity>

                    {!!isOwner && (
                        <TouchableOpacity style={styles.actionBtn} onPress={handleMorePress}>
                            <MoreVertical size={28} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bottom Info */}
                <View style={styles.bottomInfo}>
                    {post.content_type === 'embed' && <PlatformBadge platform={platform} />}

                    {/* User Section */}
                    <BlurView intensity={30} tint="dark" style={styles.floatingGlassSection}>
                        <View style={styles.userInfo}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => navigation.navigate('PublicProfile', { userId: post.userId })}
                                activeOpacity={0.7}
                            >
                                <UserAvatar
                                    userId={post.userId}
                                    size={32}
                                    style={styles.avatar}
                                />
                                <Text style={[styles.username, { fontFamily: typography.bodyMedium, maxWidth: width * 0.4 }]}>{post.username}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.followBtn}>
                                <Text style={styles.followText}>Takip Et</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>

                    {/* Caption Section */}
                    {!!post.caption && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setIsCaptionExpanded(!isCaptionExpanded)}
                        >
                            <BlurView intensity={25} tint="dark" style={[styles.floatingGlassSection, { marginTop: 8 }]}>
                                <Text
                                    style={[styles.caption, { fontFamily: typography.body, marginBottom: 0 }]}
                                    numberOfLines={isCaptionExpanded ? undefined : 2}
                                >
                                    {post.caption}
                                </Text>
                            </BlurView>
                        </TouchableOpacity>
                    )}

                    {/* Food Info Section */}
                    {!!(post.cooking_time || post.difficulty || post.calories) && (
                        <BlurView intensity={25} tint="dark" style={[styles.floatingGlassSection, { marginTop: 8 }]}>
                            <View style={[styles.foodInfoRow, { marginBottom: 0 }]}>
                                {!!post.cooking_time && (
                                    <View style={styles.foodInfoItem}>
                                        <Timer size={14} color="#fff" />
                                        <Text style={styles.foodInfoText}>{post.cooking_time}</Text>
                                    </View>
                                )}
                                {!!post.difficulty && (
                                    <View style={styles.foodInfoItem}>
                                        <Gauge size={14} color="#fff" />
                                        <Text style={styles.foodInfoText}>{post.difficulty}</Text>
                                    </View>
                                )}
                                {!!post.calories && (
                                    <View style={styles.foodInfoItem}>
                                        <Flame size={14} color="#fff" />
                                        <Text style={styles.foodInfoText}>{post.calories} kcal</Text>
                                    </View>
                                )}
                            </View>
                        </BlurView>
                    )}

                    {/* Music/Sound Section */}
                    <TouchableOpacity style={[styles.musicContainer, { marginTop: 8 }]} onPress={() => setIsMuted(!isMuted)}>
                        <BlurView intensity={20} tint="light" style={styles.musicBlur}>
                            {isMuted ? <VolumeX size={14} color="#fff" /> : <Volume2 size={14} color="#fff" />}
                            <Text style={styles.musicText}>{isMuted ? 'Ses kapalı' : 'Ses açık'}</Text>
                        </BlurView>
                    </TouchableOpacity>
                </View>
            </View>

            <SelectionPopup
                visible={showOptionsMenu}
                title="Gönderi Seçenekleri"
                onClose={() => setShowOptionsMenu(false)}
                options={[
                    {
                        label: 'Düzenle',
                        icon: <Pencil size={18} color={isDark ? '#F5F5F5' : '#1A1A1A'} />,
                        onPress: onEdit,
                    },
                    {
                        label: 'Arşivle',
                        icon: <Archive size={18} color={isDark ? '#F5F5F5' : '#1A1A1A'} />,
                        onPress: () => {
                            onArchive();
                        },
                    },
                    {
                        label: 'Sil',
                        icon: <Trash2 size={18} color={isDark ? '#F5F5F5' : '#1A1A1A'} />,
                        type: 'destructive',
                        onPress: () => {
                            Alert.alert('Sil', 'Bu gönderiyi silmek istediğine emin misin?', [
                                { text: 'Vazgeç', style: 'cancel' },
                                { text: 'Sil', style: 'destructive', onPress: () => deletePost(post.id, post.userId) },
                            ]);
                        },
                    },
                    { label: 'İptal', type: 'cancel', onPress: () => { } },
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
    const flatListRef = useRef<FlatList>(null);
    const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);

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
                            onComment={() => setActiveCommentPostId(item.id)}
                            onSave={() => setActiveSavePostId(item.id)}
                            onEdit={() => (navigation as any).navigate('EditPost', { post: item })}
                            onArchive={() => {
                                archivePost(item.id);
                                Alert.alert('Arşivlendi', 'Gönderi arşive taşındı.');
                            }}
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

            {/* Back Button */}
            <TouchableOpacity
                style={[styles.backBtn, { top: insets.top + 10 }]}
                onPress={() => navigation.goBack()}
            >
                <ArrowLeft size={28} color="#fff" />
                <Text style={styles.reelsTitle}>Reels</Text>
            </TouchableOpacity>

            {/* Popups */}
            {!!activeCommentPostId && (
                <CommentsPopup
                    postId={activeCommentPostId}
                    onClose={() => setActiveCommentPostId(null)}
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
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    rightActions: {
        position: 'absolute',
        right: 12,
        bottom: 100,
        alignItems: 'center',
        gap: 20,
    },
    actionBtn: {
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    bottomInfo: {
        width: '80%',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 1,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    username: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 12,
    },
    followBtn: {
        borderWidth: 1,
        borderColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    followText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    caption: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 12,
    },
    musicContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    musicText: {
        color: '#fff',
        fontSize: 12,
    },
    backBtn: {
        position: 'absolute',
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reelsTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    foodInfoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    foodInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    foodInfoText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
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
    platformBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    platformText: {
        fontSize: 10,
        fontWeight: '700',
    },
    floatingGlassSection: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(0,0,0,0.15)',
        width: width * 0.75, // Fixed width for alignment
    },
    musicBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 8,
        overflow: 'hidden',
    },
});
