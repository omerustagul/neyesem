import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Clock, Leaf, Search, Sparkles, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPopularPosts, Post } from '../../api/postService';
import { searchPosts, searchUsers, UserProfile } from '../../api/searchService';
import { VerificationBadge } from '../../components/common/VerificationBadge';
import CuisineSection from '../../components/cuisine/CuisineSection';
import { SeasonalCompass } from '../../components/explore/SeasonalCompass';
import { VideoThumbnail } from '../../components/feed/VideoThumbnail';
import { GlassCard } from '../../components/glass/GlassCard';
import { LevelBadge } from '../../components/level/LevelBadge';
import MoodModesSection from '../../components/mood/MoodModesSection';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');



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

                {!searchQuery ? (
                    <>
                        {/* 1. Banner: Mevsim Takvimi */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setIsSeasonModalVisible(true)}
                            style={styles.seasonTouch}
                        >
                            <GlassCard style={styles.seasonBannerCard} intensity={20}>
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
                            </GlassCard>
                        </TouchableOpacity>

                        {/* 2. Ruh Haline Göre */}
                        <MoodModesSection />

                        {/* 3. Mutfakları Keşfet */}
                        <CuisineSection />

                        {/* Top Recipes */}
                        <View style={{ marginTop: 24 }}>
                            <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium, marginBottom: 12 }]}>
                                Popüler Tarifler
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
                ) : (
                    <View style={styles.resultsContainer}>
                        {searchResults.users.length > 0 && (
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
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Text style={[styles.resultName, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                    {user.display_name}
                                                </Text>
                                                {(user.is_verified || (user.level || 1) >= 10) && <VerificationBadge size={13} />}
                                                {(user.level || 1) >= 5 && <LevelBadge level={user.level || 1} size={15} />}
                                            </View>
                                            <Text style={[styles.resultUsername, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                                @{user.username}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {searchResults.posts.length > 0 && (
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
                )}

                {/* Search History Overlay (Optional/Legacy logic fix) */}
                {isSearchFocused && !searchQuery && searchHistory.length > 0 && (
                    <View style={styles.historySection}>
                        <View style={styles.historyHeader}>
                            <Text style={[styles.resultSectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                SON ARAMALAR
                            </Text>
                            <TouchableOpacity onPress={clearHistory}>
                                <Text style={{ color: colors.saffron, fontSize: 12, fontFamily: typography.bodyMedium }}>Temizle</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.historyList}>
                            {searchHistory.map((item, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.historyItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                                    onPress={() => setSearchQuery(item)}
                                >
                                    <Clock size={14} color={theme.secondaryText} style={{ marginRight: 6 }} />
                                    <Text style={{ color: theme.text, fontFamily: typography.body, fontSize: 13 }}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
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




        </View >
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
        gap: 8,
        paddingBottom: 12,
    },
    postResultItem: {
        width: (width - 40) / 2,  // screen - 2×16px padding - 8px gap
        marginBottom: 6,
    },
    resultPostImage: {
        width: (width - 40) / 2,
        height: (width - 40) / 1.25,  // square cards, fully explicit
        borderRadius: 14,
        marginBottom: 5,
        overflow: 'hidden',
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
    seasonTouch: {
        marginBottom: 20,
    },
    seasonBannerCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginTop: 12,
    },
    seasonBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
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
    quickGridTouch: {
        width: (width - 44) / 2, // 2 columns, minus padding & gap
    },
    quickGridCard: {
        width: '100%',
        height: 100, // Compact height
        borderRadius: 24,
        padding: 12,
        justifyContent: 'center',
    },
    quickGridContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quickGridIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickGridTitle: {
        fontSize: 15,
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
