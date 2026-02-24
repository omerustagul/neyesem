import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Bookmark, Lock, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
                        const Icon = list.icon || Bookmark;
                        return (
                            <TouchableOpacity
                                key={list.id}
                                activeOpacity={0.7}
                                style={styles.gridItem}
                                onPress={() => navigation.navigate('ListDetail', { listId: list.id, listTitle: list.title })}
                            >
                                <GlassCard style={styles.listCard}>
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
                                            {list.type === 'default' ? list.subtitle : `${list.posts_count || 0} içerik`}
                                        </Text>
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
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
        justifyContent: 'space-between',
        gap: 10,
    },
    gridItem: {
        flex: 1,
    },
    listCard: {
        minHeight: 150,
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
