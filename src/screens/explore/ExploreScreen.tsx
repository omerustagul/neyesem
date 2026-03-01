import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Clock, Coffee, Globe, Info, Leaf, MapPin, Search, Sparkles, User, UtensilsCrossed, Wine, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPopularPosts, Post } from '../../api/postService';
import { searchPosts, searchUsers, UserProfile } from '../../api/searchService';
import { SeasonalCompass } from '../../components/explore/SeasonalCompass';
import { VideoThumbnail } from '../../components/feed/VideoThumbnail';
import { GlassCard } from '../../components/glass/GlassCard';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
    { id: 'mood', title: 'Modlar', icon: Sparkles, color: '#f43f5e', subtitle: 'Ruh haline uygun lezzetleri keşfet' },
    { id: 'cuisine', title: 'Mutfaklar', icon: Globe, color: '#8b5cf6', subtitle: 'Dünya mutfaklarını keşfet' },
    { id: 'tips', title: 'Püf Noktalar', icon: Info, color: '#0ea5e9', subtitle: 'Mutfak sırlarını ve püf noktalarını keşfet' },
    { id: 'trend', title: 'Trendler', icon: Clock, color: '#f59e0b', subtitle: 'Popüler lezzetleri ve tarifleri keşfet' },
];

const QUICK_CATEGORIES = [
    { id: 'it', title: 'İtalyan', count: 42 },
    { id: 'asia', title: 'Uzak Doğu', count: 28 },
    { id: 'tr', title: 'Türk', count: 65 },
    { id: 'mx', title: 'Meksika', count: 31 },
    { id: 'dessert', title: 'Tatlı', count: 27 },
];

const MOODS = [
    { id: '1', title: 'Hızlı & Pratik', icon: UtensilsCrossed, color: '#22c55e' },
    { id: '2', title: 'Romantik Akşam', icon: Wine, color: '#f43f5e' },
    { id: '3', title: 'Sakin Pazar', icon: Coffee, color: '#8b5cf6' },
];

const CUISINES = [
    { id: 'it', title: 'İtalyan', count: 42, icon: MapPin },
    { id: 'asia', title: 'Uzak Doğu', count: 28, icon: Globe },
    { id: 'tr', title: 'Türk Mutfağı', count: 65, icon: UtensilsCrossed },
    { id: 'mx', title: 'Meksika', count: 31, icon: MapPin },
    { id: 'dessert', title: 'Tatlılar', count: 27, icon: Coffee },
    { id: 'vegan', title: 'Vegan', count: 19, icon: Leaf },
];

export const ExploreScreen = () => {
    const { theme, isDark, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<{ users: UserProfile[], posts: Post[] }>({ users: [], posts: [] });
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSeasonModalVisible, setIsSeasonModalVisible] = useState(false);
    const [isMoodsModalVisible, setIsMoodsModalVisible] = useState(false);
    const [isCuisinesModalVisible, setIsCuisinesModalVisible] = useState(false);
    const [popularPosts, setPopularPosts] = useState<Post[]>([]);
    const [isLoadingPopular, setIsLoadingPopular] = useState(true);

    const headerHeight = 52 + insets.top;

    const fetchPopularData = async () => {
        setIsLoadingPopular(true);
        const posts = await getPopularPosts(10);
        setPopularPosts(posts);
        setIsLoadingPopular(false);
    };

    useEffect(() => {
        fetchPopularData();
        loadSearchHistory();
    }, []);

    const loadSearchHistory = async () => {
        try {
            const savedHistory = await AsyncStorage.getItem('@explore_search_history');
            if (savedHistory) {
                setSearchHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error('Failed to load search history.', e);
        }
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 1) {
                setIsSearching(true);
                const [users, posts] = await Promise.all([
                    searchUsers(searchQuery),
                    searchPosts(searchQuery)
                ]);
                setSearchResults({ users, posts });
            } else {
                setIsSearching(false);
                setSearchResults({ users: [], posts: [] });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const addToHistory = async (term: string) => {
        if (!term) return;
        setSearchHistory(prev => {
            const doubleRemoved = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
            const newHistory = [term, ...doubleRemoved].slice(0, 5);
            AsyncStorage.setItem('@explore_search_history', JSON.stringify(newHistory)).catch(e => console.error(e));
            return newHistory;
        });
    };

    const clearHistory = async () => {
        setSearchHistory([]);
        await AsyncStorage.removeItem('@explore_search_history');
    };

    const onRefresh = React.useCallback(async () => {
        setIsRefreshing(true);
        await fetchPopularData();
        setIsRefreshing(false);
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16 }]}
                showsVerticalScrollIndicator={false}
                bounces={true}
                alwaysBounceVertical={Platform.OS === 'ios'}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.saffron}
                        colors={[colors.saffron]}
                    />
                }
            >
                <View style={styles.titleRow}>
                    <Text style={[styles.screenTitle, { color: theme.text, fontFamily: typography.display }]}>
                        Keşfet
                    </Text>
                    <TouchableOpacity activeOpacity={0.7}>
                        <View style={styles.discoveryButton}>
                            <Sparkles size={20} color={colors.warmWhite} />
                            <Text style={[styles.discoveryButtonText, { fontFamily: typography.bodyMedium }]}>
                                YENİ KEŞİF
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchWrapper}>
                    <View style={[styles.searchContainer, {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                        borderColor: theme.border,
                    }]}>
                        {searchQuery.length > 0 ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={18} color={theme.secondaryText} />
                            </TouchableOpacity>
                        ) : (
                            <Search size={18} color={theme.secondaryText} />
                        )}
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            placeholder="Kişi, yiyecek veya tarif ara..."
                            placeholderTextColor={theme.secondaryText}
                            style={[styles.searchInput, { color: theme.text, fontFamily: typography.body }]}
                            onSubmitEditing={() => addToHistory(searchQuery)}
                        />
                    </View>
                </View>

                {searchQuery.length > 0 ? (
                    <View style={styles.resultsContainer}>
                        {!!(searchResults.users.length > 0) && (
                            <View style={styles.resultSection}>
                                <Text style={[styles.resultSectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                    KİŞİLER
                                </Text>
                                {searchResults.users.map(user => (
                                    <TouchableOpacity
                                        key={user.id}
                                        style={styles.userResult}
                                        onPress={() => {
                                            addToHistory(searchQuery);
                                            navigation.navigate('PublicProfile', { userId: user.id });
                                        }}
                                    >
                                        {!!user.avatar_url ? (
                                            <Image source={{ uri: user.avatar_url }} style={styles.resultAvatar} />
                                        ) : (
                                            <View style={[styles.resultAvatarFallback, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                                <User size={16} color={theme.secondaryText} />
                                            </View>
                                        )}
                                        <View>
                                            <Text style={[styles.resultName, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                {user.display_name}
                                            </Text>
                                            <Text style={[styles.resultUsername, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                                @{user.username}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {!!(searchResults.posts.length > 0) && (
                            <View style={styles.resultSection}>
                                <Text style={[styles.resultSectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                    TARİFLER
                                </Text>
                                <View style={styles.postsGrid}>
                                    {searchResults.posts.map(post => (
                                        <TouchableOpacity
                                            key={post.id}
                                            style={styles.postResultItem}
                                            onPress={() => {
                                                addToHistory(searchQuery);
                                                navigation.navigate('Reels', { initialPostId: post.id });
                                            }}
                                        >
                                            <VideoThumbnail
                                                videoUri={post.content_url || ''}
                                                thumbnailUri={post.thumbnail_url}
                                                style={styles.resultPostImage}
                                                showPlayIcon={post.content_type === 'video' || post.content_type === 'embed' || !!post.content_url?.match(/\.(mp4|mov|m4v|m3u8)$/i)}
                                                views={post.views || 0}
                                            />
                                            <Text style={[styles.postCaption, { color: theme.text, fontFamily: typography.body }]} numberOfLines={1}>
                                                {post.caption}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {searchResults.users.length === 0 && searchResults.posts.length === 0 && !isSearching && (
                            <View style={styles.emptyResults}>
                                <Text style={{ color: theme.secondaryText, fontFamily: typography.body }}>
                                    Sonuç bulunamadı.
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <>
                        {/* Search History */}
                        {!!(isSearchFocused && searchHistory.length > 0) && (
                            <View style={styles.historySection}>
                                <View style={styles.historyHeader}>
                                    <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                        GEÇMİŞ ARAMALAR
                                    </Text>
                                    <TouchableOpacity onPress={clearHistory}>
                                        <Text style={{ color: colors.saffron, fontSize: 12, fontFamily: typography.bodyMedium }}>Temizle</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.historyList}>
                                    {searchHistory.map((item, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[styles.historyItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                                            onPress={() => setSearchQuery(item)}
                                        >
                                            <Clock size={12} color={theme.secondaryText} />
                                            <Text style={{ color: theme.text, fontSize: 13, fontFamily: typography.body }}>{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Banner: Mevsim Takvimi */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.seasonBanner, { backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.06)' }]}
                            onPress={() => setIsSeasonModalVisible(true)}
                        >
                            <View style={styles.seasonBannerContent}>
                                <View style={[styles.seasonBannerIconWrap, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                                    <Leaf size={28} color="#22c55e" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Text style={[styles.seasonBannerTitle, { color: theme.text, fontFamily: typography.display }]}>
                                        Mevsim Takvimi
                                    </Text>
                                    <Text style={[styles.seasonBannerSub, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                        Bu ay hangi ürünler tüketilmeli? Öğrenmek için tıkla.
                                    </Text>
                                </View>
                                <ChevronRight size={20} color={theme.secondaryText} style={{ marginLeft: 10 }} />
                            </View>
                        </TouchableOpacity>

                        {/* Quick Actions (Grid) */}
                        <View style={styles.quickGrid}>
                            {QUICK_ACTIONS.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <TouchableOpacity
                                        key={action.id}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            if (action.id === 'mood') {
                                                setIsMoodsModalVisible(true);
                                            } else if (action.id === 'cuisine') {
                                                setIsCuisinesModalVisible(true);
                                            } else {
                                                setSearchQuery(action.title);
                                            }
                                        }}
                                        style={[styles.quickGridCard, {
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                                            borderColor: theme.border
                                        }]}
                                    >
                                        <View style={[styles.quickGridIconWrap, { backgroundColor: `${action.color}15` }]}>
                                            <Icon size={20} color={action.color} />
                                        </View>
                                        <View style={{ marginTop: 16 }}>
                                            <Text style={[styles.quickGridTitle, { color: theme.text, fontFamily: typography.display }]}>
                                                {action.title}
                                            </Text>
                                            <Text style={[styles.quickGridSub, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                                {action.subtitle}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Top Recipes */}
                        <View style={{ marginTop: 24 }}>
                            <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium, marginBottom: 12 }]}>
                                POPÜLER TARİFLER
                            </Text>

                            {isLoadingPopular ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ActivityIndicator color={colors.saffron} />
                                </View>
                            ) : (
                                <View style={styles.postsGrid}>
                                    {popularPosts.map(post => (
                                        <TouchableOpacity
                                            key={post.id}
                                            style={styles.postResultItem}
                                            onPress={() => {
                                                navigation.navigate('Reels', { initialPostId: post.id });
                                            }}
                                        >
                                            <VideoThumbnail
                                                videoUri={post.content_url || ''}
                                                thumbnailUri={post.thumbnail_url}
                                                style={styles.resultPostImage}
                                                showPlayIcon={post.content_type === 'video' || post.content_type === 'embed' || !!post.content_url?.match(/\.(mp4|mov|m4v|m3u8)$/i)}
                                                views={post.views || 0}
                                            />
                                            <Text style={[styles.postCaption, { color: theme.text, fontFamily: typography.body }]} numberOfLines={1}>
                                                {post.caption}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
            {isRefreshing && (
                <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', pointerEvents: 'none', zIndex: 9999 }]}>
                    <ActivityIndicator color={colors.saffron} />
                </View>
            )}

            <Modal
                visible={isSeasonModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsSeasonModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsSeasonModalVisible(false)} style={styles.modalCloseBtn}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[{ color: theme.text, fontFamily: typography.display, fontSize: 18, flex: 1, textAlign: 'center', marginRight: 40 }]}>Mevsim Takvimi</Text>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        <SeasonalCompass />
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>

            {/* Moods Modal */}
            <Modal
                visible={isMoodsModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsMoodsModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsMoodsModalVisible(false)} style={styles.modalCloseBtn}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[{ color: theme.text, fontFamily: typography.display, fontSize: 18, flex: 1, textAlign: 'center', marginRight: 40 }]}>Modunuz Nasıl?</Text>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        <View style={styles.moodRow}>
                            {MOODS.map((mood) => {
                                const Icon = mood.icon;
                                return (
                                    <TouchableOpacity
                                        key={mood.id}
                                        activeOpacity={0.7}
                                        style={styles.moodItem}
                                        onPress={() => {
                                            setSearchQuery(mood.title);
                                            setIsMoodsModalVisible(false);
                                        }}
                                    >
                                        <GlassCard style={styles.moodCard}>
                                            <View style={[styles.moodIconContainer, { backgroundColor: `${mood.color}20` }]}>
                                                <Icon size={26} color={mood.color} />
                                            </View>
                                            <Text style={[styles.moodText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                {mood.title}
                                            </Text>
                                        </GlassCard>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>

            {/* Cuisines Modal */}
            <Modal
                visible={isCuisinesModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsCuisinesModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsCuisinesModalVisible(false)} style={styles.modalCloseBtn}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[{ color: theme.text, fontFamily: typography.display, fontSize: 18, flex: 1, textAlign: 'center', marginRight: 40 }]}>Dünya Mutfakları</Text>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        <View style={styles.cuisineGrid}>
                            {CUISINES.map((cuisine) => {
                                const Icon = cuisine.icon;
                                return (
                                    <TouchableOpacity
                                        key={cuisine.id}
                                        activeOpacity={0.7}
                                        style={styles.cuisineItem}
                                        onPress={() => {
                                            setSearchQuery(cuisine.title);
                                            setIsCuisinesModalVisible(false);
                                        }}
                                    >
                                        <GlassCard style={styles.cuisineCard}>
                                            <View style={[styles.cuisineIconWrap, {
                                                backgroundColor: isDark ? 'rgba(20,133,74,0.15)' : 'rgba(20,133,74,0.08)',
                                            }]}>
                                                <Icon size={16} color={colors.saffron} />
                                            </View>
                                            <Text style={[styles.cuisineTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                {cuisine.title}
                                            </Text>
                                            <Text style={[styles.cuisineCount, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                                {cuisine.count} tarif
                                            </Text>
                                        </GlassCard>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    screenTitle: {
        fontSize: 26,
    },
    discoveryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 14,
        backgroundColor: colors.saffron,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    discoveryButtonText: {
        color: colors.warmWhite,
        fontSize: 11,
        letterSpacing: 0.5,
    },
    searchWrapper: {
        marginBottom: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 11,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        padding: 0,
    },
    resultsContainer: {
        marginTop: 10,
    },
    resultSection: {
        marginBottom: 20,
    },
    resultSectionTitle: {
        fontSize: 11,
        letterSpacing: 1,
        marginBottom: 12,
    },
    userResult: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    resultAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    resultAvatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultName: {
        fontSize: 14,
    },
    resultUsername: {
        fontSize: 12,
        opacity: 0.7,
    },
    postsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    postResultItem: {
        width: (width - 40) / 2,
        marginBottom: 8,
    },
    resultPostImage: {
        width: '100%',
        aspectRatio: 0.75,
        borderRadius: 16,
        marginBottom: 4,
    },
    postCaption: {
        fontSize: 12,
    },
    emptyResults: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    historySection: {
        marginBottom: 24,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historyList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    sectionTitle: {
        fontSize: 12,
        letterSpacing: 1.5,
    },
    seasonBanner: {
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
    },
    seasonBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 16,
    },
    seasonBannerIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    seasonBannerTitle: {
        fontSize: 18,
        marginBottom: 4,
    },
    seasonBannerSub: {
        fontSize: 13,
        lineHeight: 18,
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickGridCard: {
        width: (width - 44) / 2, // 2 columns, minus padding & gap
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
    },
    quickGridIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickGridTitle: {
        fontSize: 16,
        marginBottom: 2,
    },
    quickGridSub: {
        fontSize: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 20 : 16,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.2)',
    },
    modalCloseBtn: {
        width: 40,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        gap: 6,
    },
    categoryChipTitle: {
        fontSize: 13,
    },
    categoryChipBadge: {
        backgroundColor: colors.saffron,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    categoryChipCount: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    moodRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
        justifyContent: 'center',
    },
    moodItem: {
        width: (width - 44) / 2,
    },
    moodCard: {
        height: 120,
        justifyContent: 'flex-end',
        padding: 16,
    },
    moodIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    moodText: {
        fontSize: 14,
        lineHeight: 18,
    },
    cuisineGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
        marginTop: 16,
    },
    cuisineItem: {
        width: '48.5%',
    },
    cuisineCard: {
        minHeight: 100,
        justifyContent: 'center',
        padding: 16,
    },
    cuisineIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    cuisineTitle: {
        fontSize: 15,
        marginBottom: 4,
    },
    cuisineCount: {
        fontSize: 13,
    },
});
