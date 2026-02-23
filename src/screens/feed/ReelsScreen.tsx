import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import { ArrowLeft, Bookmark, Flame, Gauge, Heart, MessageCircle, MoreVertical, Play, Timer, User, Volume2, VolumeX } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Dimensions, FlatList, Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { archivePost, deletePost, Post, subscribeToFeedPosts, togglePostLike } from '../../api/postService';
import { CommentsPopup } from '../../components/social/CommentsPopup';
import { SavePopup } from '../../components/social/SavePopup';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const ReelItem = ({ post, isActive, onComment, onSave, isScreenFocused, onEdit, onArchive }: { post: Post; isActive: boolean; onComment: () => void; onSave: () => void; isScreenFocused: boolean; onEdit: () => void; onArchive: () => void }) => {
    const { theme, typography } = useTheme();
    const { user } = useAuthStore();
    const navigation = useNavigation<any>();
    const videoRef = useRef<Video>(null);
    const isLiked = post.liked_by?.includes(user?.uid || '');
    const isSaved = post.saved_by?.includes(user?.uid || '');
    const isOwner = user?.uid === post.userId;
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [rate, setRate] = useState(1.0);

    useEffect(() => {
        if (isActive && !isPaused && isScreenFocused) {
            videoRef.current?.playAsync();
        } else {
            videoRef.current?.pauseAsync();
        }
    }, [isActive, isPaused, isScreenFocused]);

    const handleTap = () => {
        setIsPaused(!isPaused);
    };

    const handleMorePress = () => {
        if (!isOwner) return;

        const options = ['Düzenle', 'Arşivle', 'Sil', 'Vazgeç'];
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 3,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        onEdit();
                    } else if (buttonIndex === 1) {
                        onArchive();
                    } else if (buttonIndex === 2) {
                        Alert.alert('Sil', 'Bu gönderiyi silmek istediğine emin misin?', [
                            { text: 'Vazgeç', style: 'cancel' },
                            { text: 'Sil', style: 'destructive', onPress: () => deletePost(post.id, post.userId) }
                        ]);
                    }
                }
            );
        } else {
            Alert.alert('Seçenekler', '', [
                { text: 'Düzenle', onPress: onEdit },
                { text: 'Arşivle', onPress: onArchive },
                { text: 'Sil', style: 'destructive', onPress: () => deletePost(post.id, post.userId) },
                { text: 'Vazgeç', style: 'cancel' }
            ]);
        }
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
                {post.content_url ? (
                    <Video
                        ref={videoRef}
                        source={{ uri: post.content_url }}
                        style={styles.video}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={isActive && !isPaused && isScreenFocused}
                        isLooping
                        isMuted={!isScreenFocused || isMuted}
                        rate={rate}
                        shouldCorrectPitch={true}
                    />
                ) : (
                    <View style={[styles.video, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#fff' }}>Video Bulunamadı</Text>
                    </View>
                )}
            </TouchableOpacity>

            {rate === 2.0 && (
                <View style={styles.speedIndicator}>
                    <Text style={styles.speedText}>2x</Text>
                </View>
            )}

            {isPaused && (
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

                    {isOwner && (
                        <TouchableOpacity style={styles.actionBtn} onPress={handleMorePress}>
                            <MoreVertical size={28} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bottom Info */}
                <View style={styles.bottomInfo}>
                    <View style={styles.userInfo}>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => navigation.navigate('PublicProfile', { userId: post.userId })}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.avatar, { backgroundColor: colors.saffron }]}>
                                {post.avatar_url ? (
                                    <Image source={{ uri: post.avatar_url }} style={styles.avatarImage} />
                                ) : (
                                    <User size={18} color="#fff" />
                                )}
                            </View>
                            <Text style={[styles.username, { fontFamily: typography.bodyMedium }]}>{post.username}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.followBtn}>
                            <Text style={styles.followText}>Takip Et</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.caption, { fontFamily: typography.body }]} numberOfLines={2}>
                        {post.caption}
                    </Text>

                    {/* Food Info Row */}
                    {(post.cooking_time || post.difficulty || post.calories) && (
                        <View style={styles.foodInfoRow}>
                            {post.cooking_time && (
                                <View style={styles.foodInfoItem}>
                                    <Timer size={14} color="#fff" />
                                    <Text style={styles.foodInfoText}>{post.cooking_time}</Text>
                                </View>
                            )}
                            {post.difficulty && (
                                <View style={styles.foodInfoItem}>
                                    <Gauge size={14} color="#fff" />
                                    <Text style={styles.foodInfoText}>{post.difficulty}</Text>
                                </View>
                            )}
                            {post.calories && (
                                <View style={styles.foodInfoItem}>
                                    <Flame size={14} color="#fff" />
                                    <Text style={styles.foodInfoText}>{post.calories} kcal</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <TouchableOpacity style={styles.musicContainer} onPress={() => setIsMuted(!isMuted)}>
                        {isMuted ? <VolumeX size={14} color="#fff" /> : <Volume2 size={14} color="#fff" />}
                        <Text style={styles.musicText}>{isMuted ? 'Ses kapalı' : 'Ses açık'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
            const videoPosts = fetchedPosts.filter(p => p.content_type === 'video' || p.content_type === 'embed');
            setPosts(videoPosts);

            if (route.params?.initialPostId && !isInitialScrollDone) {
                const index = videoPosts.findIndex(p => p.id === route.params.initialPostId);
                if (index !== -1) {
                    setActiveIndex(index);
                    // Scroll will be handled by initialScrollIndex since we use a conditional render
                }
                setIsInitialScrollDone(true);
            }
        });
        return () => unsubscribe();
    }, []);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {posts.length > 0 && (
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
                    initialScrollIndex={route.params?.initialPostId ? Math.max(0, posts.findIndex(p => p.id === route.params.initialPostId)) : 0}
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
        marginBottom: 12,
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
        borderRadius: 6,
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
});
