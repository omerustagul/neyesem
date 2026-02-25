import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { ArrowLeft, Bookmark, Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../api/firebase';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

type ActivityTab = 'likes' | 'comments' | 'saves' | 'shares';

interface ActivityItem {
    id: string;
    postId: string;
    postCaption?: string;
    postImage?: string;
    content?: string; // for comments
    createdAt: any;
}

const TABS: { key: ActivityTab; label: string; icon: any; color: string }[] = [
    { key: 'likes', label: 'Beğeniler', icon: Heart, color: '#ef4444' },
    { key: 'comments', label: 'Yorumlar', icon: MessageCircle, color: '#3b82f6' },
    { key: 'saves', label: 'Kaydedilenler', icon: Bookmark, color: colors.saffron },
    { key: 'shares', label: 'Paylaşımlar', icon: Share2, color: '#10b981' },
];

export const ActivitiesScreen = () => {
    const { theme, typography, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<ActivityTab>('likes');
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        setActivities([]);

        let collectionPath = '';
        switch (activeTab) {
            case 'likes':
                collectionPath = 'likes';
                break;
            case 'comments':
                collectionPath = 'comments';
                break;
            case 'saves':
                collectionPath = 'saves';
                break;
            case 'shares':
                collectionPath = 'shares';
                break;
        }

        const q = query(
            collection(db, collectionPath),
            where('user_id', '==', user.uid),
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: ActivityItem[] = snapshot.docs.map(doc => ({
                id: doc.id,
                postId: doc.data().post_id || '',
                postCaption: doc.data().post_caption || '',
                postImage: doc.data().post_image || '',
                content: doc.data().content || doc.data().text || '',
                createdAt: doc.data().created_at,
            }));
            setActivities(items);
            setLoading(false);
        }, () => {
            setActivities([]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, activeTab]);

    const activeTabConfig = TABS.find(t => t.key === activeTab)!;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const minutes = Math.floor(diff / 60000);
            if (minutes < 1) return 'Az önce';
            if (minutes < 60) return `${minutes}dk önce`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}sa önce`;
            const days = Math.floor(hours / 24);
            if (days < 7) return `${days}g önce`;
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        } catch {
            return '';
        }
    };

    const renderItem = ({ item, index }: { item: ActivityItem; index: number }) => {
        const Icon = activeTabConfig.icon;
        return (
            <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 250, delay: index * 50 }}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => item.postId && navigation.navigate('Reels', { initialPostId: item.postId })}
                    style={[styles.activityItem, {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }]}
                >
                    {item.postImage ? (
                        <Image source={{ uri: item.postImage }} style={styles.itemImage} />
                    ) : (
                        <View style={[styles.itemImagePlaceholder, { backgroundColor: `${activeTabConfig.color}15` }]}>
                            <Icon size={20} color={activeTabConfig.color} />
                        </View>
                    )}
                    <View style={styles.itemContent}>
                        {activeTab === 'comments' && item.content ? (
                            <>
                                <Text style={[styles.itemComment, { color: theme.text, fontFamily: typography.body }]} numberOfLines={2}>
                                    "{item.content}"
                                </Text>
                                <Text style={[styles.itemMeta, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                    {formatDate(item.createdAt)}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.itemCaption, { color: theme.text, fontFamily: typography.body }]} numberOfLines={2}>
                                    {item.postCaption || 'Gönderi'}
                                </Text>
                                <Text style={[styles.itemMeta, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                    {formatDate(item.createdAt)}
                                </Text>
                            </>
                        )}
                    </View>
                    <View style={[styles.itemIcon, { backgroundColor: `${activeTabConfig.color}12` }]}>
                        <Icon size={14} color={activeTabConfig.color} fill={activeTab === 'likes' ? activeTabConfig.color : 'transparent'} />
                    </View>
                </TouchableOpacity>
            </MotiView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255)' : 'rgba(0,0,0,0)' }]}
                >
                    <ArrowLeft size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                    Hareketlerin
                </Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}
            >
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const Icon = tab.icon;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => setActiveTab(tab.key)}
                            activeOpacity={0.7}
                            style={[
                                styles.tab,
                                {
                                    backgroundColor: isActive ? `${tab.color}15` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                                    borderColor: isActive ? tab.color : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                                }
                            ]}
                        >
                            <Icon size={12} color={isActive ? tab.color : theme.secondaryText} fill={tab.key === 'likes' && isActive ? tab.color : 'transparent'} />
                            <Text style={[styles.tabLabel, {
                                color: isActive ? tab.color : theme.secondaryText,
                                fontFamily: isActive ? typography.bodyMedium : typography.body,
                            }]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <Text style={{ color: theme.secondaryText, fontFamily: typography.body }}>Yükleniyor...</Text>
                </View>
            ) : activities.length === 0 ? (
                <View style={styles.center}>
                    <MotiView
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={styles.emptyIcon}
                    >
                        <activeTabConfig.icon size={48} color={theme.secondaryText} />
                    </MotiView>
                    <Text style={[styles.emptyText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Henüz {activeTabConfig.label.toLowerCase()} etkileşimi bulunamadı.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={(item) => item.id}
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
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        gap: 8,
        paddingBottom: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        borderWidth: 1,
    },
    tabLabel: {
        fontSize: 13,
    },
    listContent: {
        padding: 16,
        gap: 8,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: 12,
    },
    itemImagePlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: {
        flex: 1,
    },
    itemCaption: {
        fontSize: 14,
        lineHeight: 20,
    },
    itemComment: {
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    itemMeta: {
        fontSize: 11,
        marginTop: 2,
    },
    itemIcon: {
        width: 28,
        height: 28,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
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
    },
});
