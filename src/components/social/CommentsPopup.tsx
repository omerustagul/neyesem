import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetFooter } from '@gorhom/bottom-sheet';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { Edit2, Heart, Trash2, X } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { Portal } from 'react-native-paper';
import { Comment, addComment, deleteComment, subscribeToComments, toggleCommentLike, updateComment } from '../../api/commentService';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAuthStore } from '../../store/authStore';
import { useLevelStore } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { VerificationBadge } from '../common/VerificationBadge';
import { LevelBadge, getGoldUsernameColor } from '../level/LevelBadge';

interface CommentsPopupProps {
    postId: string;
    onClose: () => void;
    focusCommentId?: string | null;
}

/** Inline sub-component: shows display name with level + verification badge */
const CommentUserBadge: React.FC<{ userId: string; displayName?: string }> = ({ userId, displayName }) => {
    const { theme, typography } = useTheme();
    const profile = useUserProfile(userId);
    const level = profile?.level ?? 1;
    const isVerified = profile?.is_verified || level >= 10;
    const goldColor = getGoldUsernameColor(level);
    const showLevelBadge = level >= 5;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[{ fontSize: 13, color: goldColor || theme.text, fontFamily: typography.bodyMedium }]}>
                {profile?.display_name || profile?.username || displayName || 'Kullanıcı'}
            </Text>
            {isVerified && <VerificationBadge size={13} />}
            {showLevelBadge && <LevelBadge level={level} size={16} />}
        </View>
    );
};

interface CommentItemProps {
    item: Comment;
    user: any;
    isDark: boolean;
    highlightedCommentId: string | null;
    handleEdit: (comment: Comment) => void;
    handleDelete: (commentId: string) => void;
    toggleCommentLike: (commentId: string, userId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
    item,
    user,
    isDark,
    highlightedCommentId,
    handleEdit,
    handleDelete,
    toggleCommentLike
}) => {
    const { theme, typography } = useTheme();
    const profile = useUserProfile(item.userId);
    const isOwner = user?.uid === item.userId;
    const isLiked = item.liked_by?.includes(user?.uid || '');
    const isHighlighted = highlightedCommentId === item.id;

    const avatarUrl = profile?.avatar_url || (item as any).avatar_url;
    const displayName = profile?.display_name || item.display_name;

    return (
        <View style={[
            styles.commentItem,
            isHighlighted && {
                backgroundColor: isDark ? 'rgba(255,178,0,0.12)' : 'rgba(255,178,0,0.08)',
                paddingHorizontal: 16,
            }
        ]}>
            {/* Avatar Left */}
            <View style={styles.avatarWrapper}>
                {avatarUrl ? (
                    <ExpoImage source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: `${colors.saffron}20` }]}>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>
                            {displayName?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.commentContent}>
                {/* Username line */}
                <View style={styles.commentHeader}>
                    <CommentUserBadge userId={item.userId} displayName={item.display_name} />
                    <Text style={[styles.time, { color: theme.secondaryText }]}>
                        {item.created_at
                            ? formatDistanceToNow(
                                item.created_at.toDate ? item.created_at.toDate() : new Date(item.created_at),
                                { addSuffix: true, locale: tr }
                            )
                            : ''}
                    </Text>
                </View>

                {/* Comment text */}
                <Text style={[styles.commentText, { color: theme.text, fontFamily: typography.body }]}>
                    {item.text}
                </Text>

                {/* Reply / Edit options */}
                <View style={styles.commentActions}>
                    <TouchableOpacity style={styles.replyButton}>
                        <Text style={[styles.replyText, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>Yanıtla</Text>
                    </TouchableOpacity>

                    {isOwner && (
                        <>
                            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.replyButton}>
                                <Edit2 size={12} color={theme.secondaryText} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.replyButton}>
                                <Trash2 size={12} color={colors.spiceRed} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* Like right wrapper */}
            <View style={styles.likeWrapper}>
                <TouchableOpacity
                    onPress={() => toggleCommentLike(item.id, user?.uid || '')}
                    style={styles.likeButtonInner}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                    <Heart
                        size={14}
                        color={isLiked ? colors.spiceRed : theme.secondaryText}
                        fill={isLiked ? colors.spiceRed : 'transparent'}
                    />
                    {!!item.likes_count && item.likes_count > 0 && (
                        <Text style={[styles.likeCount, { color: theme.secondaryText }]}>
                            {item.likes_count}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export const CommentsPopup: React.FC<CommentsPopupProps> = ({ postId, onClose, focusCommentId }) => {
    const { theme, typography, isDark } = useTheme();
    const { user } = useAuthStore();
    const currentUserProfile = useUserProfile(user?.uid);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const flatListRef = useRef<any>(null);
    const inputRef = useRef<any>(null);
    // Daha Instagram tarzı bir hissiyat için ekran boyutuna oranlı modal yüksekliği
    const snapPoints = useMemo(() => ['70%', '90%'], []);

    const [comments, setComments] = useState<Comment[]>([]);
    const [inputText, setInputText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setIsKeyboardVisible(false));
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToComments(postId, (fetchedComments) => {
            setComments(fetchedComments);
        });
        return () => unsubscribe();
    }, [postId]);

    // Scroll to focused comment when comments load
    useEffect(() => {
        if (focusCommentId && comments.length > 0 && flatListRef.current) {
            const index = comments.findIndex(c => c.id === focusCommentId);
            if (index !== -1) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
                    setHighlightedCommentId(focusCommentId);
                    // Remove highlight after 2.5s
                    setTimeout(() => setHighlightedCommentId(null), 2500);
                }, 500);
            }
        }
    }, [focusCommentId, comments]);

    const handleSend = async () => {
        if (!user || !inputText.trim()) return;

        try {
            if (editingCommentId) {
                await updateComment(editingCommentId, inputText.trim());
                setEditingCommentId(null);
            } else {
                await addComment(
                    postId,
                    user.uid,
                    user.displayName || 'Kullanıcı',
                    user.displayName || 'Kullanıcı',
                    user.photoURL || '',
                    inputText.trim()
                );
            }

            // Reward XP
            const { addXP } = useLevelStore.getState();
            await addXP(user.uid, 4);

            setInputText('');
            Keyboard.dismiss();
        } catch (error) {
            Alert.alert('Hata', 'Yorum gönderilemedi.');
        }
    };

    const handleDelete = (commentId: string) => {
        Alert.alert('Yorumu Sil', 'Bu yorumu silmek istediğinize emin misiniz?', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteComment(commentId, postId);
                    } catch (error) {
                        Alert.alert('Hata', 'Yorum silinemedi.');
                    }
                }
            },
        ]);
    };

    const handleEdit = (comment: Comment) => {
        setInputText(comment.text);
        setEditingCommentId(comment.id);
        // Delay focus to ensure keyboard opens properly
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleCancelEdit = () => {
        setInputText('');
        setEditingCommentId(null);
        Keyboard.dismiss();
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                onPress={onClose}
                opacity={0.5}
            />
        ),
        [onClose]
    );

    const renderBackground = useCallback(() => (
        <View style={StyleSheet.absoluteFill}>
            <BlurView
                intensity={isDark ? 50 : 80}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                        borderRadius: 30,
                        overflow: 'hidden',
                        borderWidth: 1.5,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    }
                ]}
            />
        </View>
    ), [isDark]);

    const renderItem = useCallback(({ item }: { item: Comment }) => (
        <CommentItem
            item={item}
            user={user}
            isDark={isDark}
            highlightedCommentId={highlightedCommentId}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            toggleCommentLike={toggleCommentLike}
        />
    ), [user, isDark, highlightedCommentId]);

    const renderFooter = useCallback(
        (props: any) => (
            <BottomSheetFooter {...props} bottomInset={0}>
                <View style={styles.footerContainer}>
                    <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.inputBlur}>
                        {/* Quick Emojis */}
                        {!isKeyboardVisible && (
                            <View style={styles.emojiListRow}>
                                {['❤️', '🔥', '😂', '😍', '🙌', '👏'].map(emoji => (
                                    <TouchableOpacity key={emoji} onPress={() => setInputText(prev => prev + emoji)} style={styles.emojiButton}>
                                        <Text style={styles.emojiText}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.inputContainer} onStartShouldSetResponder={() => true}>
                            {currentUserProfile?.avatar_url || user?.photoURL ? (
                                <ExpoImage source={{ uri: currentUserProfile?.avatar_url || user?.photoURL || '' }} style={styles.inputAvatar} />
                            ) : (
                                <View style={[styles.inputAvatarFallback, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Text style={{ color: colors.saffron, fontSize: 13, fontWeight: '700' }}>
                                        {currentUserProfile?.display_name?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || '?'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.inputWrapper} onStartShouldSetResponder={() => true} pointerEvents="box-none">
                                <TextInput
                                    ref={inputRef}
                                    style={[styles.input, {
                                        color: theme.text,
                                        fontFamily: typography.body,
                                    }]}
                                    placeholder={editingCommentId ? "Yorumu düzenle..." : "Düşüncelerini paylaş..."}
                                    placeholderTextColor={theme.secondaryText}
                                    value={inputText}
                                    onChangeText={setInputText}
                                    multiline
                                    maxLength={500}
                                    returnKeyType="default"
                                    blurOnSubmit={false}
                                    editable={true}
                                    selectTextOnFocus={true}
                                />
                                {inputText.trim().length > 0 && (
                                    <TouchableOpacity onPress={handleSend} style={styles.sendButtonCircle}>
                                        <Text style={[styles.sendButtonText, { color: colors.warmWhite, fontFamily: typography.bodyMedium }]}>
                                            ↑
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </BlurView>
                </View>
            </BottomSheetFooter>
        ),
        [isDark, theme, typography, user, inputText, editingCommentId, currentUserProfile, isKeyboardVisible]
    );

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                footerComponent={renderFooter}
                backgroundComponent={renderBackground}
                enablePanDownToClose
                keyboardBehavior="extend"
                keyboardBlurBehavior="restore"
                onClose={onClose}
                backgroundStyle={{
                    backgroundColor: 'transparent',
                }}
                handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', width: 40 }}
                android_keyboardInputMode="adjustResize"
                enableDynamicSizing={false}
                enableHandlePanningGesture={true}
                enableContentPanningGesture={true}
                enableOverDrag={false}
                activeOffsetY={[-10, 10]}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
                    <Text style={[styles.title, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                        Yorumlar
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={20} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Scrollable comments */}
                <BottomSheetFlatList
                    ref={flatListRef}
                    data={comments}
                    keyExtractor={(item: Comment) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={{ color: theme.secondaryText, fontFamily: typography.body }}>
                                İlk yorumu sen yap! 🍽️
                            </Text>
                        </View>
                    }
                    onScrollToIndexFailed={(info: any) => {
                        setTimeout(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                        }, 300);
                    }}
                />

                {/* Edit indicator */}
                <AnimatePresence>
                    {editingCommentId && (
                        <MotiView
                            from={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 40 }}
                            exit={{ opacity: 0, height: 0 }}
                            style={[styles.editBanner, { backgroundColor: isDark ? 'rgba(255,178,0,0.12)' : 'rgba(255,178,0,0.08)' }]}
                        >
                            <Text style={{ color: colors.saffron, fontFamily: typography.body, fontSize: 12, flex: 1 }}>
                                Yorum düzenleniyor...
                            </Text>
                            <TouchableOpacity onPress={handleCancelEdit}>
                                <X size={16} color={colors.saffron} />
                            </TouchableOpacity>
                        </MotiView>
                    )}
                </AnimatePresence>
            </BottomSheet>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    headerSpacer: {
        width: 32,
    },
    closeBtn: {
        position: 'absolute',
        right: 16,
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
    },
    title: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    listContent: {
        paddingTop: 8,
        paddingBottom: 20,
    },
    commentItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    avatarWrapper: {
        marginRight: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    commentContent: {
        flex: 1,
        paddingRight: 8,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
        gap: 6,
    },
    time: {
        fontSize: 11,
        marginLeft: 2,
        opacity: 0.6,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 20,
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    replyText: {
        fontSize: 12,
        opacity: 0.7,
    },
    likeWrapper: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 4,
        width: 30,
    },
    likeButtonInner: {
        alignItems: 'center',
    },
    likeCount: {
        fontSize: 11,
        marginTop: 4,
        opacity: 0.6,
    },
    emojiListRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 4,
    },
    emojiButton: {
        padding: 4,
    },
    emojiText: {
        fontSize: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    inputAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginBottom: 6,
    },
    inputAvatarFallback: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingRight: 6,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 14,
        textAlignVertical: 'center',
    },
    sendButtonCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.saffron,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    sendButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
    },
    editBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        overflow: 'hidden',
        gap: 8,
    },
    footerContainer: {
        paddingHorizontal: 12,
        paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    },
    inputBlur: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        borderRadius: 38,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(240, 240, 240, 0.1)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
});
