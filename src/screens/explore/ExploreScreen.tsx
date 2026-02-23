import { Coffee, Globe, Leaf, MapPin, Search, Sparkles, UtensilsCrossed, Wine } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/glass/GlassCard';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

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
    const [searchQuery, setSearchQuery] = useState('');
    const headerHeight = 52 + insets.top;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16 }]}
                showsVerticalScrollIndicator={false}
                bounces={true}
                alwaysBounceVertical={Platform.OS === 'ios'}
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
                <View style={[styles.searchContainer, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                    borderColor: theme.border,
                }]}>
                    <Search size={18} color={theme.secondaryText} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Ne yemek istersiniz?"
                        placeholderTextColor={theme.secondaryText}
                        style={[styles.searchInput, { color: theme.text, fontFamily: typography.body }]}
                    />
                </View>

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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 11,
        marginBottom: 20,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        padding: 0,
    },
    sectionTitle: {
        fontSize: 12,
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    moodRow: {
        paddingBottom: 8,
        gap: 10,
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
        borderRadius: 10,
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
