import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ResizeMode, Video } from 'expo-av';
import { ChefHat, Flame, Gauge, MoreVertical, Play, Timer } from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { ActionSheetIOS, Alert, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { sendPalateSignal } from '../../api/palateService';
import { archivePost, deletePost, Post } from '../../api/postService';
import { useEmbed } from '../../hooks/useEmbed';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { UserAvatar } from '../common/UserAvatar';
import { CommentButton, InfoButton, LikeButton, SaveButton } from '../social/SocialButtons';

const { width } = Dimensions.get('window');

interface VideoPostCardProps {
    post: Post;
    isLiked: boolean;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onShare: () => void;
    isVisible?: boolean;
    isMutedOverride?: boolean;
}

export const VideoPostCard: React.FC<VideoPostCardProps> = ({
    post,
    isLiked,
    onLike,
    onComment,
    onSave,
    onShare,
    isVisible = true,
    isMutedOverride = false
}) => {
    const { theme, typography, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const { user } = useAuthStore();
    const { embedHtml, platform, isLoading, error } = useEmbed(post.content_url || '');
    const [playbackRate, setPlaybackRate] = React.useState(1.0);
    const [isPaused, setIsPaused] = React.useState(false);

    const isOwner = user?.uid === post.userId;
    const viewStartTime = React.useRef<number | null>(null);

    React.useEffect(() => {
        if (isVisible && isFocused && !isPaused) {
            viewStartTime.current = Date.now();
        } else if (viewStartTime.current) {
            const duration = Date.now() - viewStartTime.current;
            if (user && duration > 500) { // Ignore micro-views
                const type = duration < 3000 ? 'view_under_3s' :
                    duration < 10000 ? 'view_3_to_10s' : 'view_over_10s';
                sendPalateSignal(user.uid, type, post.id, post.tags || []);
            }
            viewStartTime.current = null;
        }

        return () => {
            if (viewStartTime.current && user) {
                const duration = Date.now() - viewStartTime.current;
                if (duration > 500) {
                    const type = duration < 3000 ? 'view_under_3s' :
                        duration < 10000 ? 'view_3_to_10s' : 'view_over_10s';
                    sendPalateSignal(user.uid, type, post.id, post.tags || []);
                }
            }
        };
    }, [isVisible, isFocused, isPaused]);

    const handlePressMedia = () => {
        if (post.content_type === 'video' || post.content_type === 'embed') {
            navigation.navigate('Reels', { initialPostId: post.id });
        }
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
                        navigation.navigate('EditPost', { post });
                    } else if (buttonIndex === 1) {
                        archivePost(post.id);
                        Alert.alert('Arşivlendi', 'Gönderi arşive taşındı.');
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
                { text: 'Düzenle', onPress: () => navigation.navigate('EditPost', { post }) },
                { text: 'Arşivle', onPress: () => { archivePost(post.id); Alert.alert('Arşivlendi', 'Gönderi arşive taşındı.'); } },
                { text: 'Sil', style: 'destructive', onPress: () => deletePost(post.id, post.userId) },
                { text: 'Vazgeç', style: 'cancel' }
            ]);
        }
    };

    const renderMedia = () => {
        if (!post.content_url) {
            return (
                <View style={[styles.mediaPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <ChefHat size={48} color={theme.secondaryText} />
                </View>
            );
        }

        if (post.content_type === 'embed') {
            if (isLoading) {
                return (
                    <View style={[styles.mediaPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <Text style={{ color: theme.secondaryText }}>Yükleniyor...</Text>
                    </View>
                );
            }
            if (error) {
                return (
                    <View style={[styles.mediaPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <Text style={{ color: colors.spiceRed }}>İçerik yüklenemedi.</Text>
                    </View>
                );
            }
            return (
                <View style={[styles.mediaContainer, styles.webviewWrapper]}>
                    <WebView
                        originWhitelist={['*']}
                        source={{
                            html: `
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body { margin: 0; padding: 0; display: flex; justify-content: center; background: transparent; }
                      iframe { max-width: 100% !important; width: 100% !important; border: none !important; height: 100vh !important; }
                    </style>
                  </head>
                  <body>
                    ${embedHtml}
                    <script async src="//www.instagram.com/embed.js"></script>
                    <script async src="https://www.tiktok.com/embed.js"></script>
                  </body>
                </html>
              ` }}
                        style={styles.webview}
                        scrollEnabled={false}
                    />
                    <TouchableOpacity style={styles.mediaOverlay} onPress={handlePressMedia} />
                </View>
            );
        }

        // Default to video if content_url exists and it's not embed
        return (
            <TouchableOpacity
                style={styles.mediaContainer}
                onPress={handlePressMedia}
                onLongPress={() => setPlaybackRate(2.0)}
                onPressOut={() => setPlaybackRate(1.0)}
                activeOpacity={0.9}
            >
                <Video
                    source={{ uri: post.content_url }}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={isVisible && isFocused && !isPaused && !isMutedOverride}
                    isLooping
                    isMuted={!isVisible || !isFocused || isPaused || isMutedOverride}
                    rate={playbackRate}
                    shouldCorrectPitch={true}
                    usePoster={!!post.thumbnail_url}
                    posterSource={post.thumbnail_url ? { uri: post.thumbnail_url } : undefined}
                    posterStyle={{ resizeMode: 'cover' }}
                />
                {playbackRate === 2.0 && (
                    <View style={styles.speedIndicator}>
                        <Text style={styles.speedText}>2x</Text>
                    </View>
                )}
                {(isPaused || (!isVisible && post.content_url)) && (
                    <View style={styles.playIconContainer}>
                        <Play size={32} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.4)" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const InfoCard = ({ icon: Icon, label, value, color }: any) => (
        <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }]}>
            <Icon size={14} color={color || theme.secondaryText} />
            <View>
                <Text style={[styles.infoLabel, { color: theme.secondaryText, fontFamily: typography.body }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: theme.text, fontFamily: typography.bodyMedium }]}>{value}</Text>
            </View>
        </View>
    );

    return (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.userInfo, { flex: 1 }]}
                    onPress={() => navigation.navigate('PublicProfile', { userId: post.userId })}
                    activeOpacity={0.7}
                >
                    <UserAvatar
                        userId={post.userId}
                        size={38}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={[styles.username, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {post.display_name || post.username}
                        </Text>
                    </View>
                </TouchableOpacity>
                {isOwner && (
                    <TouchableOpacity onPress={handleMorePress} style={styles.moreButton}>
                        <MoreVertical size={20} color={theme.secondaryText} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Media Content */}
            {renderMedia()}

            {/* Interaction Buttons */}
            <View style={styles.actions}>
                <View style={styles.leftActions}>
                    <InfoButton onPress={() => navigation.navigate('FoodDetail', { post })} />
                </View>
                <View style={styles.rightActions}>
                    <LikeButton count={post.likes_count} isLiked={isLiked} onLike={onLike} />
                    <CommentButton count={post.comments_count} onPress={onComment} />
                    <SaveButton count={post.saves_count || 0} isSaved={post.saved_by?.includes(user?.uid || '')} onSave={onSave} />
                </View>
            </View>

            {/* Post Caption */}
            {post.caption && (
                <View style={styles.captionContainer}>
                    <Text style={[styles.caption, { color: theme.text, fontFamily: typography.body }]}>
                        <Text style={{ fontFamily: typography.bodyMedium }}>{post.username} </Text>
                        {post.caption}
                    </Text>
                </View>
            )}

            {/* Food Info Cards */}
            {(post.cooking_time || post.difficulty || post.calories || post.protein) && (
                <View style={styles.infoGrid}>
                    {post.cooking_time && (
                        <InfoCard icon={Timer} label="Süre" value={post.cooking_time} color={colors.saffron} />
                    )}
                    {post.difficulty && (
                        <InfoCard icon={Gauge} label="Zorluk" value={post.difficulty} color={colors.mintFresh} />
                    )}
                    {post.calories && (
                        <InfoCard icon={Flame} label="Kalori" value={`${post.calories} kcal`} color={colors.spiceRed} />
                    )}
                    {post.protein && (
                        <InfoCard icon={ChefHat} label="Protein" value={post.protein} color={colors.oliveLight} />
                    )}
                </View>
            )}

            <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    username: {
        fontSize: 14,
    },
    time: {
        fontSize: 12,
        opacity: 0.7,
    },
    moreButton: {
        padding: 4,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 19,
    },
    mediaContainer: {
        width: width,
        aspectRatio: 0.75, // 4:3 Ratio (Instagram Style)
        backgroundColor: 'rgba(0,0,0,0.05)',
        position: 'relative',
    },
    speedIndicator: {
        position: 'absolute',
        top: 20,
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
    video: {
        width: '100%',
        height: '100%',
    },
    playIconContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -16 }, { translateY: -16 }],
        pointerEvents: 'none',
    },
    mediaPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    webviewWrapper: {
        flex: 1,
        position: 'relative',
    },
    mediaOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    leftActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    captionContainer: {
        paddingHorizontal: 14,
        paddingBottom: 12,
    },
    caption: {
        fontSize: 14,
        lineHeight: 18,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        minWidth: (width - 40) / 2,
        gap: 8,
    },
    infoLabel: {
        fontSize: 10,
        marginBottom: 1,
    },
    infoValue: {
        fontSize: 12,
    },
    divider: {
        height: 1,
        width: '100%',
        marginTop: 10,
        opacity: 0.3,
    },
});

