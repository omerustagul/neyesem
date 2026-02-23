import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Inbox, RefreshCw, Trash2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deletePost, Post, subscribeToArchivedPosts, unarchivePost } from '../../api/postService';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const ArchiveScreen = () => {
    const { theme, typography, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToArchivedPosts(user.uid, (archivedPosts) => {
            setPosts(archivedPosts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleRestore = async (postId: string) => {
        try {
            await unarchivePost(postId);
            Alert.alert('Başarılı', 'Gönderi tekrar yayınlandı.');
        } catch (error) {
            Alert.alert('Hata', 'İşlem başarısız oldu.');
        }
    };

    const handleDelete = (postId: string) => {
        Alert.alert(
            'Gönderiyi Sil',
            'Bu işlem geri alınamaz. Emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePost(postId, user!.uid);
                        } catch (error) {
                            Alert.alert('Hata', 'Silme işlemi başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Post }) => (
        <View style={[styles.postItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }]}>
            <Image source={{ uri: item.content_url }} style={styles.postImage} />
            <View style={styles.postInfo}>
                <Text style={[styles.postCaption, { color: theme.text, fontFamily: typography.body }]} numberOfLines={2}>
                    {item.caption}
                </Text>
                <Text style={[styles.postStats, { color: theme.secondaryText, fontFamily: typography.mono }]}>
                    {item.likes_count} Beğeni • {item.comments_count} Yorum
                </Text>
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={() => handleRestore(item.id)}
                        style={[styles.actionButton, { backgroundColor: `${colors.saffron}15` }]}
                    >
                        <RefreshCw size={16} color={colors.saffron} />
                        <Text style={[styles.actionText, { color: colors.saffron, fontFamily: typography.bodyMedium }]}>Yayına Al</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={[styles.actionButton, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                    >
                        <Trash2 size={16} color="#ef4444" />
                        <Text style={[styles.actionText, { color: '#ef4444', fontFamily: typography.bodyMedium }]}>Sil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={theme.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                    Arşiv
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <Text style={{ color: theme.secondaryText }}>Yükleniyor...</Text>
                </View>
            ) : posts.length === 0 ? (
                <View style={styles.center}>
                    <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={styles.emptyIcon}
                    >
                        <Inbox size={48} color={theme.secondaryText} />
                    </MotiView>
                    <Text style={[styles.emptyText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Arşivlenmiş gönderi bulunamadı.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
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
        paddingHorizontal: 16,
        paddingBottom: 12,
        height: Platform.OS === 'ios' ? 100 : 70,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    postItem: {
        flexDirection: 'row',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        height: 140,
    },
    postImage: {
        width: 100,
        height: '100%',
    },
    postInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    postCaption: {
        fontSize: 14,
        lineHeight: 20,
    },
    postStats: {
        fontSize: 11,
        opacity: 0.8,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 6,
    },
    actionText: {
        fontSize: 12,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
    }
});
