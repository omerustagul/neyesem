import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Edit2, Heart, Send, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { Comment, addComment, deleteComment, subscribeToComments, toggleCommentLike, updateComment } from '../../api/commentService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

interface CommentsPopupProps {
    postId: string;
    onClose: () => void;
}

export const CommentsPopup: React.FC<CommentsPopupProps> = ({ postId, onClose }) => {
    const { theme, typography, isDark } = useTheme();
    const { user } = useAuthStore();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['65%', '90%'], []);

    const [comments, setComments] = useState<Comment[]>([]);
    const [inputText, setInputText] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToComments(postId, (fetchedComments) => {
            setComments(fetchedComments);
        });
        return () => unsubscribe();
    }, [postId]);

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
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                onPress={onClose}
            />
        ),
        [onClose]
    );

    const renderItem = ({ item }: { item: Comment }) => {
        const isOwner = user?.uid === item.userId;
        const isLiked = item.liked_by?.includes(user?.uid || '');

        return (
            <View style={styles.commentItem}>
                <View style={[styles.avatar, { backgroundColor: `${colors.saffron}20` }]}>
                    <Text style={{ color: theme.text }}>{item.display_name?.charAt(0)}</Text>
                </View>
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={[styles.username, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {item.display_name}
                        </Text>
                        <Text style={[styles.time, { color: theme.secondaryText }]}>
                            {item.created_at ? 'Şimdi' : ''}
                        </Text>
                    </View>
                    <Text style={[styles.commentText, { color: theme.text, fontFamily: typography.body }]}>
                        {item.text}
                    </Text>
                    <View style={styles.commentActions}>
                        <TouchableOpacity
                            onPress={() => toggleCommentLike(item.id, user?.uid || '')}
                            style={styles.actionButton}
                        >
                            <Heart
                                size={14}
                                color={isLiked ? colors.spiceRed : theme.secondaryText}
                                fill={isLiked ? colors.spiceRed : 'transparent'}
                            />
                            <Text style={[styles.actionText, { color: theme.secondaryText }]}>
                                {item.likes_count || 0}
                            </Text>
                        </TouchableOpacity>

                        {isOwner && (
                            <>
                                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                                    <Edit2 size={14} color={theme.secondaryText} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                                    <Trash2 size={14} color={colors.spiceRed} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                onClose={onClose}
                backgroundStyle={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
                handleIndicatorStyle={{ backgroundColor: theme.border }}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            Yorumlar ({comments.length})
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <BottomSheetFlatList
                        data={comments}
                        keyExtractor={(item: Comment) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={{ color: theme.secondaryText }}>İlk yorumu sen yap!</Text>
                            </View>
                        }
                    />

                    <View style={[styles.inputContainer, {
                        borderTopColor: theme.border,
                        backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF'
                    }]}>
                        <BottomSheetTextInput
                            style={[styles.input, {
                                color: theme.text,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                fontFamily: typography.body
                            }]}
                            placeholder={editingCommentId ? "Yorumu düzenle..." : "Yorum yap..."}
                            placeholderTextColor={theme.secondaryText}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                            style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.saffron : theme.border }]}
                        >
                            <Send size={18} color={colors.warmWhite} />
                        </TouchableOpacity>
                    </View>
                </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 100,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    username: {
        fontSize: 14,
        marginRight: 8,
    },
    time: {
        fontSize: 11,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 18,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
        fontSize: 14,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
});
