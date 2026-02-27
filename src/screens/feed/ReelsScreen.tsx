import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Archive, ArrowLeft, Bookmark, Flag, Flame, Gauge, Heart, Info, Instagram, MessageCircle, MoreVertical, Music2, Pencil, Play, Timer, Trash2, User as UserIcon, UserMinus, Volume2, VolumeX } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const insets = useSafeAreaInsets();
    const isLiked = post.liked_by?.includes(user?.uid || '');
    const isSaved = post.saved_by?.includes(user?.uid || '');
    const isOwner = user?.uid === post.userId;
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [rate, setRate] = useState(1.0);
    const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
    const [showReadMoreButton, setShowReadMoreButton] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);

    const { embedHtml, nativeVideoUrl, platform, isLoading: isEmbedLoading } = useEmbed(post.content_url || '');

    // Initialize expo-video player
    const isVideo = post.content_type === 'video' || (!post.content_type && post.content_url?.match(/\.(mp4|mov|m4v|m3u8)$|firebase-storage/i)) || !!nativeVideoUrl;
    const player = useVideoPlayer(isVideo ? (nativeVideoUrl || post.content_url || '') : 'https://assets.mixkit.co/videos/preview/mixkit-transparent-water-in-slow-motion-44391-preview.mp4', (player: any) => {
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
                <View style={[styles.rightActions, { bottom: insets.bottom + 80 }]}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => togglePostLike(post.id, user?.uid || '')}>
                        <BlurView intensity={25} tint="dark" style={styles.glassActionBtn}>
                            <Heart size={24} color={isLiked ? colors.spiceRed : '#fff'} fill={isLiked ? colors.spiceRed : 'transparent'} />
                        </BlurView>
                        <Text style={styles.actionText}>{post.likes_count || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
                        <BlurView intensity={25} tint="dark" style={styles.glassActionBtn}>
                            <MessageCircle size={22} color="#fff" />
                        </BlurView>
                        <Text style={styles.actionText}>{post.comments_count || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={onSave}>
                        <BlurView intensity={25} tint="dark" style={styles.glassActionBtn}>
                            <Bookmark size={23} color={isSaved ? colors.saffron : '#fff'} fill={isSaved ? colors.saffron : 'transparent'} />
                        </BlurView>
                        <Text style={styles.actionText}>{post.saves_count || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={handleMorePress}>
                        <BlurView intensity={25} tint="dark" style={styles.glassActionBtn}>
                            <MoreVertical size={24} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>
                </View>

                {/* Bottom Info */}
                <View style={[styles.bottomInfo, { bottom: insets.bottom + 80 }]}>
                    {post.content_type === 'embed' && (
                        <BlurView intensity={25} tint="dark" style={[styles.pillGlassSection, { marginBottom: 8 }]}>
                            <PlatformBadge platform={platform} />
                        </BlurView>
                    )}

                    {/* User Section */}
                    <BlurView intensity={30} tint="dark" style={[styles.pillGlassSection, { paddingVertical: 8, paddingHorizontal: 12 }]}>
                        <View style={styles.userInfo}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => navigation.navigate('PublicProfile', { userId: post.userId })}
                                activeOpacity={0.7}
                            >
                                <UserAvatar
                                    userId={post.userId}
                                    size={36}
                                    style={styles.avatar}
                                />
                                <Text style={[styles.username, { fontFamily: typography.bodyMedium, maxWidth: width * 0.45 }]}>{post.username}</Text>
                            </TouchableOpacity>
                            {!isOwner && (
                                <TouchableOpacity style={styles.followBtn}>
                                    <Text style={styles.followText}>Takip Et</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </BlurView>

                    {/* Caption Section */}
                    {!!post.caption && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {
                                if (showReadMoreButton) {
                                    setIsCaptionExpanded(!isCaptionExpanded);
                                }
                            }}
                            style={{ marginTop: 8 }}
                        >
                            <BlurView intensity={25} tint="dark" style={styles.pillGlassSection}>
                                <Text
                                    style={[styles.caption, { fontFamily: typography.body, marginBottom: 0 }]}
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
                                    <Text style={{ color: colors.saffron, marginTop: 4, fontSize: 13, fontFamily: typography.bodyMedium }}>
                                        ... devamını gör
                                    </Text>
                                )}
                            </BlurView>
                        </TouchableOpacity>
                    )}

                    {/* Food Info Section */}
                    {!!(post.cooking_time || post.difficulty || post.calories) && (
                        <View style={[styles.foodInfoRow, { marginTop: 8 }]}>
                            {!!post.cooking_time && (
                                <BlurView intensity={25} tint="dark" style={styles.pillGlassSection}>
                                    <View style={[styles.foodInfoItem, { marginBottom: 0 }]}>
                                        <Timer size={12} color="#fff" />
                                        <Text style={styles.foodInfoText}>{post.cooking_time}</Text>
                                    </View>
                                </BlurView>
                            )}
                            {!!post.difficulty && (
                                <BlurView intensity={25} tint="dark" style={styles.pillGlassSection}>
                                    <View style={[styles.foodInfoItem, { marginBottom: 0 }]}>
                                        <Gauge size={12} color="#fff" />
                                        <Text style={styles.foodInfoText}>{post.difficulty}</Text>
                                    </View>
                                </BlurView>
                            )}
                            {!!post.calories && (
                                <BlurView intensity={25} tint="dark" style={styles.pillGlassSection}>
                                    <View style={[styles.foodInfoItem, { marginBottom: 0 }]}>
                                        <Flame size={12} color="#fff" />
                                        <Text style={styles.foodInfoText}>{post.calories} kcal</Text>
                                    </View>
                                </BlurView>
                            )}
                        </View>
                    )}

                    {/* Music/Sound Section */}
                    <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => setIsMuted(!isMuted)}>
                        <BlurView intensity={20} tint="light" style={[styles.pillGlassSection, { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 }]}>
                            {isMuted ? <VolumeX size={12} color="#fff" /> : <Volume2 size={12} color="#fff" />}
                            <Text style={styles.musicText}>{isMuted ? 'Ses kapalı' : 'Orijinal Ses'}</Text>
                        </BlurView>
                    </TouchableOpacity>
                </View>
            </View>

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
                <Text style={styles.reelsTitle}>Videolar</Text>
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
        marginTop: 6,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    glassActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    pillGlassSection: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(0,0,0,0.15)',
        alignSelf: 'flex-start',
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
});
