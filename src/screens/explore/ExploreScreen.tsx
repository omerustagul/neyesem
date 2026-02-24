import { useNavigation } from '@react-navigation/native';
import { Clock, Coffee, Globe, Leaf, MapPin, Search, Sparkles, User, UtensilsCrossed, Wine, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Post } from '../../api/postService';
import { searchPosts, searchUsers, UserProfile } from '../../api/searchService';
import { VideoThumbnail } from '../../components/feed/VideoThumbnail';
import { GlassCard } from '../../components/glass/GlassCard';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

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
    const [searchHistory, setSearchHistory] = useState<string[]>(['Pizza', 'Burger', 'Healthy']);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const headerHeight = 52 + insets.top;

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

    const addToHistory = (term: string) => {
        if (!term) return;
        setSearchHistory(prev => {
            const doubleRemoved = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
            return [term, ...doubleRemoved].slice(0, 5);
        });
    };

    const onRefresh = React.useCallback(() => {
        setIsRefreshing(true);
        // Simulate refresh for now as it's static data
        setTimeout(() => setIsRefreshing(false), 1500);
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
                            <Sparkles size={14} color={colors.warmWhite} />
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
                            placeholder="Kişi veya tarif ara..."
                            placeholderTextColor={theme.secondaryText}
                            style={[styles.searchInput, { color: theme.text, fontFamily: typography.body }]}
                            onSubmitEditing={() => addToHistory(searchQuery)}
                        />
                    </View>
                </View>

                {searchQuery.length > 0 ? (
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
                                        {user.avatar_url ? (
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
                                                navigation.navigate('Reels', { postId: post.id });
                                            }}
                                        >
                                            {post.content_type === 'video' && post.content_url ? (
                                                <VideoThumbnail
                                                    videoUri={post.content_url}
                                                    thumbnailUri={post.thumbnail_url}
                                                    style={styles.resultPostImage}
                                                />
                                            ) : post.thumbnail_url || post.content_url ? (
                                                <Image source={{ uri: post.thumbnail_url || post.content_url }} style={styles.resultPostImage} />
                                            ) : (
                                                <View style={[styles.resultPostImage, { backgroundColor: colors.glassBorder }]} />
                                            )}
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
                        {searchHistory.length > 0 && (
                            <View style={styles.historySection}>
                                <View style={styles.historyHeader}>
                                    <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                        GEÇMİŞ ARAMALAR
                                    </Text>
                                    <TouchableOpacity onPress={() => setSearchHistory([])}>
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

                        {/* Moods Section */}
                        <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                            MODUNUZ
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.moodRow}
                            decelerationRate="fast"
                            snapToInterval={152}
                        >
                            {MOODS.map((mood, index) => {
                                const Icon = mood.icon;
                                return (
                                    <TouchableOpacity
                                        key={mood.id}
                                        activeOpacity={0.7}
                                        style={[styles.moodItem, index === MOODS.length - 1 && { marginRight: 0 }]}
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
                        </ScrollView>

                        {/* Cuisines Section */}
                        <Text style={[styles.sectionTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium, marginTop: 8 }]}>
                            MUTFAKLAR
                        </Text>
                        <View style={styles.cuisineGrid}>
                            {CUISINES.map((cuisine) => {
                                const Icon = cuisine.icon;
                                return (
                                    <TouchableOpacity key={cuisine.id} activeOpacity={0.7} style={styles.cuisineItem}>
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
                    </>
                )}
            </ScrollView>
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
        borderRadius: 10,
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
        borderRadius: 40,
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
    },
    postResultItem: {
        width: (width - 48) / 2,
        marginBottom: 8,
    },
    resultPostImage: {
        width: '100%',
        height: 100,
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
    moodRow: {
        paddingBottom: 8,
        gap: 10,
        marginTop: 12,
    },
    moodItem: {
        width: 140,
    },
    moodCard: {
        height: 150,
        justifyContent: 'flex-end',
    },
    moodIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 44,
    },
    moodText: {
        fontSize: 13,
        lineHeight: 17,
    },
    cuisineGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
        marginBottom: 16,
        marginTop: 12,
    },
    cuisineItem: {
        width: '48.5%',
    },
    cuisineCard: {
        minHeight: 90,
        justifyContent: 'center',
    },
    cuisineIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    cuisineTitle: {
        fontSize: 14,
        marginBottom: 2,
    },
    cuisineCount: {
        fontSize: 12,
    },
});
