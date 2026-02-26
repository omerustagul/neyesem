import { useNavigation } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Bookmark, Lock, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { GlassCard } from '../../components/glass/GlassCard';
import { CreateListPopup } from '../../components/lists/CreateListPopup';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const DEFAULT_LISTS = [
    {
        id: 'all',
        title: 'Tüm Kaydedilenler',
        subtitle: 'Burası daima seninle',
        icon: Bookmark,
        type: 'default'
    }
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GAP = 8;
// Use percentage-based width for better responsiveness in a 2-column grid
const CARD_WIDTH_PERCENT = '48.8%';

const ListCard = ({ list, onPress }: any) => {
    const { theme, isDark, typography } = useTheme();
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const Icon = list.icon || Bookmark;

    useEffect(() => {
        const fetchThumbnail = async () => {
            if (list.type === 'default') {
                // Fetch latest saved post thumbnail for 'All Saved'
                try {
                    const q = query(
                        collection(db, 'posts'),
                        where('saved_by', 'array-contains', doc(db, 'profiles', 'dummy').id.split('/')[0] === 'dummy' ? 'placeholder' : 'none') // This is tricky for default
                    );
                    // For simplicity, just get the very latest post if it's default 'All Saved'
                    // In a real app we'd fetch the user's latest saved post
                } catch { }
            } else if (list.postIds && list.postIds.length > 0) {
                try {
                    const postRef = doc(db, 'posts', list.postIds[list.postIds.length - 1]);
                    const postSnap = await getDoc(postRef);
                    if (postSnap.exists()) {
                        setThumbnail(postSnap.data().thumbnail_url || postSnap.data().content_url);
                    }
                } catch { }
            }
        };
        fetchThumbnail();
    }, [list]);

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            style={styles.gridItem}
            onPress={onPress}
        >
            <GlassCard
                style={styles.listCard}
                contentStyle={styles.listCardContent}
                borderRadius={24}
            >
                {thumbnail && (
                    <ExpoImage
                        source={{ uri: thumbnail }}
                        style={[StyleSheet.absoluteFill, { opacity: 0.15, borderRadius: 24 }]}
                        contentFit="cover"
                        blurRadius={2}
                    />
                )}
                <View style={styles.cardTopRow}>
                    <View style={[styles.iconWrap, {
                        backgroundColor: isDark ? 'rgba(255,178,0,0.1)' : 'rgba(255,178,0,0.05)',
                    }]}>
                        <Icon size={22} color={colors.saffron} />
                    </View>
                    {list.locked && (
                        <View style={[styles.lockBadge, { borderColor: theme.border }]}>
                            <Lock size={10} color={theme.secondaryText} />
                        </View>
                    )}
                </View>
                <View style={styles.cardBottom}>
                    <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.bodyMedium }]} numberOfLines={2}>
                        {list.title}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: theme.secondaryText, fontFamily: typography.body }]} numberOfLines={1}>
                        {list.type === 'default' ? list.subtitle : `${list.postIds?.length || 0} içerik`}
                    </Text>
                </View>
            </GlassCard>
        </TouchableOpacity>
    );
};

export const ListsScreen = () => {
    const { theme, isDark, typography } = useTheme();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [userLists, setUserLists] = useState<any[]>([]);
    const [isCreateVisible, setIsCreateVisible] = useState(false);
    const headerHeight = 52 + insets.top;

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'lists'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const lists = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUserLists(lists);
        });

        return () => unsubscribe();
    }, [user]);

    const combinedLists = [...DEFAULT_LISTS, ...userLists];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16 }]}
                showsVerticalScrollIndicator={false}
                bounces={true}
                alwaysBounceVertical={Platform.OS === 'ios'}
            >
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                        Listelerim
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setIsCreateVisible(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <View style={styles.addButton}>
                            <Plus size={20} color={colors.warmWhite} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.grid}>
                    {combinedLists.map((list) => (
                        <ListCard
                            key={list.id}
                            list={list}
                            onPress={() => navigation.navigate('ListDetail', { listId: list.id, listTitle: list.title })}
                        />
                    ))}
                </View>
            </ScrollView>

            <CreateListPopup
                visible={isCreateVisible}
                onClose={() => setIsCreateVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
    },
    addButton: {
        width: 38,
        height: 38,
        borderRadius: 16,
        backgroundColor: colors.saffron,
        alignItems: 'center',
        justifyContent: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
        marginTop: 8,
    },
    gridItem: {
        width: CARD_WIDTH_PERCENT,
        aspectRatio: 1,
    },
    listCard: {
        flex: 1,
    },
    listCardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBottom: {
        marginTop: 4,
    },
    cardTitle: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '700',
    },
    cardSubtitle: {
        fontSize: 11,
        opacity: 0.6,
        marginTop: 2,
    },
});
