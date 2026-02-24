import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Bookmark, Lock, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
            <GlassCard style={styles.listCard}>
                {thumbnail && (
                    <Image
                        source={{ uri: thumbnail }}
                        style={[StyleSheet.absoluteFill, { opacity: 0.15, borderRadius: 24 }]}
                        resizeMode="cover"
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
                <View>
                    <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                        {list.title}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
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
                    >
                        <View style={styles.addButton}>
                            <Plus size={20} color={colors.warmWhite} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.grid}>
                    {combinedLists.map((list) => {
                        return (
                            <ListCard
                                key={list.id}
                                list={list}
                                onPress={() => navigation.navigate('ListDetail', { listId: list.id, listTitle: list.title })}
                            />
                        );
                    })}
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
        columnGap: 12,
        rowGap: 12, // Ensure row gap matches column gap
        marginTop: 8,
    },
    gridItem: {
        width: (Dimensions.get('window').width - 32 - 12) / 2,
    },
    listCard: {
        height: 160,
        justifyContent: 'space-between',
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 15,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 12,
    },
});
