import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where
} from 'firebase/firestore';
import {
    Bookmark,
    ChevronLeft,
    Lock,
    Share2,
    Trash2
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { Post } from '../../api/postService';
import { VideoThumbnail } from '../../components/feed/VideoThumbnail';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

export const ListDetailScreen = ({ route, navigation }: any) => {
    const { listId, listTitle } = route.params;
    const { theme, isDark, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();

    const [list, setList] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const isOwner = user && list?.userId === user.uid;

    useEffect(() => {
        // 1. Fetch List Metadata
        const unsubList = onSnapshot(doc(db, 'lists', listId), (snap) => {
            if (snap.exists()) {
                setList({ id: snap.id, ...snap.data() });
            } else if (listId !== 'all') {
                navigation.goBack();
            } else {
                setList({ id: 'all', title: 'Tüm Kaydedilenler', locked: true });
            }
        });

        // 2. Fetch/Listen for Saved Posts
        let unsubPosts: () => void;

        if (listId === 'all') {
            // Special Case: All saved posts
            const q = query(collection(db, 'posts'), where('saved_by', 'array-contains', user?.uid));
            unsubPosts = onSnapshot(q, (snap) => {
                setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
                setLoading(false);
            });
        } else {
            // Regular list case: posts saved in this specific list
            // Note: This assumes we store listId in the interaction or a separate collection
            // For now, let's filter posts that have this listId in a hypothetical saved_lists array or just saved_by
            // Simplification: Let's fetch posts where post.id is in list.postIds
            const fetchListPosts = async () => {
                const listSnap = await getDoc(doc(db, 'lists', listId));
                if (listSnap.exists()) {
                    const postIds = listSnap.data().postIds || [];
                    if (postIds.length > 0) {
                        const postsQ = query(collection(db, 'posts'), where('__name__', 'in', postIds.slice(0, 10)));
                        const pSnap = await getDocs(postsQ);
                        setPosts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
                    } else {
                        setPosts([]);
                    }
                }
                setLoading(false);
            };
            fetchListPosts();
            unsubPosts = () => { };
        }

        return () => {
            unsubList();
            unsubPosts();
        };
    }, [listId, user]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${list?.title || listTitle} listesine göz at! neyesem://list/${listId}`,
                url: `https://neyesem.app/list/${listId}` // Link to web version or deep link
            });
        } catch (error) {
            console.error('Error sharing list:', error);
        }
    };

    const handleDeleteList = () => {
        if (!isOwner || listId === 'all') return;

        Alert.alert(
            'Listeyi Sil',
            'Bu listeyi silmek istediğine emin misin? İçindeki videolar silinmeyecek.',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteDoc(doc(db, 'lists', listId));
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const renderPostItem = ({ item, index }: { item: Post, index: number }) => (
        <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 50 }}
            style={styles.postItem}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Reels', { initialPostId: item.id })}
            >
                <VideoThumbnail
                    videoUri={item.content_url || ''}
                    thumbnailUri={item.thumbnail_url}
                    style={styles.postThumbnail}
                    showPlayIcon={true}
                    views={item.views || 0}
                />
                <View style={styles.postInfo}>
                    <Text style={[styles.postTitle, { color: '#fff', fontFamily: typography.bodyMedium }]} numberOfLines={1}>
                        {item.display_name || item.username}
                    </Text>
                </View>
            </TouchableOpacity>
        </MotiView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <ChevronLeft color={theme.text} size={28} />
                </TouchableOpacity>

                <View style={styles.headerTitleArea}>
                    <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                        {list?.title || listTitle}
                    </Text>
                    {list?.locked && <Lock size={12} color={theme.secondaryText} style={{ marginLeft: 6 }} />}
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                        <Share2 color={theme.text} size={22} />
                    </TouchableOpacity>
                    {isOwner && listId !== 'all' && (
                        <TouchableOpacity onPress={handleDeleteList} style={[styles.iconBtn, { marginLeft: 10 }]}>
                            <Trash2 color={colors.spiceRed} size={22} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.saffron} />
                </View>
            ) : posts.length > 0 ? (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPostItem}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.center}>
                    <Bookmark size={48} color={theme.secondaryText} style={{ opacity: 0.3 }} />
                    <Text style={[styles.emptyText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Bu listede henüz içerik yok.
                    </Text>
                </View>
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
        paddingBottom: 16,
    },
    headerTitleArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 18,
        textAlign: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 60,
        justifyContent: 'flex-end',
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    listContent: {
        padding: 10,
    },
    postItem: {
        width: (width - 30) / 2,
        height: (width - 30) * 0.75,
        margin: 5,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    postThumbnail: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    postOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    postInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    postTitle: {
        fontSize: 12,
    },
});
