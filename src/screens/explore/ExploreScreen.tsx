import { Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/glass/GlassCard';
import { GlassInput } from '../../components/glass/GlassInput';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const MOODS = [
    { id: '1', title: 'Hızlı & Pratik', emoji: '🥗' },
    { id: '2', title: 'Romantik Akşam', emoji: '🥃' },
    { id: '3', title: 'Sakin Pazar', emoji: '🍵' },
];

const CUISINES = [
    { id: 'it', title: 'İtalyan', count: 42 },
    { id: 'asia', title: 'Uzak Doğu', count: 28 },
    { id: 'tr', title: 'Türk Mutfağı', count: 65 },
    { id: 'mx', title: 'Meksika', count: 31 },
    { id: 'dessert', title: 'Tatlılar', count: 27 },
    { id: 'vegan', title: 'Vegan', count: 19 },
];

export const ExploreScreen = () => {
    const { theme, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const headerHeight = 64 + insets.top;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16 }]}
                showsVerticalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                bounces={false}
            >
                <View style={styles.titleRow}>
                    <Text style={[styles.screenTitle, { color: theme.text, fontFamily: typography.display }]}>
                        Keşfet
                    </Text>
                    <TouchableOpacity activeOpacity={0.8}>
                        <View style={styles.discoveryButton}>
                            <Sparkles size={16} color={colors.warmWhite} />
                            <Text style={[styles.discoveryButtonText, { fontFamily: typography.bodyMedium }]}>
                                YENİ KEŞİF
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <GlassInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Ne yemek istersiniz?"
                    containerStyle={styles.searchInput}
                />

                <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                    MODUNUZ
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
                    {MOODS.map((mood, index) => (
                        <TouchableOpacity key={mood.id} activeOpacity={0.8} style={[styles.moodItem, index === MOODS.length - 1 && { marginRight: 0 }]}>
                            <GlassCard style={styles.moodCard}>
                                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                <Text style={[styles.moodText, { fontFamily: typography.display }]}>{mood.title}</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                    MUTFAKLAR
                </Text>
                <View style={styles.cuisineGrid}>
                    {CUISINES.map((cuisine) => (
                        <TouchableOpacity key={cuisine.id} activeOpacity={0.8} style={styles.cuisineItem}>
                            <GlassCard style={styles.cuisineCard}>
                                <Text style={[styles.cuisineTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                    {cuisine.title}
                                </Text>
                                <Text style={[styles.cuisineCount, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                    {cuisine.count} tarif
                                </Text>
                            </GlassCard>
                        </TouchableOpacity>
                    ))}
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
        paddingHorizontal: 20,
        paddingBottom: 110,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    screenTitle: {
        fontSize: 40,
    },
    discoveryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 14,
        backgroundColor: colors.saffron,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    discoveryButtonText: {
        color: colors.warmWhite,
        fontSize: 13,
    },
    searchInput: {
        marginTop: 0,
        marginBottom: 26,
    },
    sectionTitle: {
        fontSize: 28,
        letterSpacing: 0.4,
        marginBottom: 12,
    },
    moodRow: {
        paddingBottom: 8,
    },
    moodItem: {
        width: 144,
        marginRight: 14,
        marginBottom: 24,
    },
    moodCard: {
        minHeight: 190,
        justifyContent: 'flex-end',
        padding: 14,
    },
    moodEmoji: {
        fontSize: 36,
        marginBottom: 56,
    },
    moodText: {
        color: '#FFFFFF',
        fontSize: 20,
        lineHeight: 22,
    },
    cuisineGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    cuisineItem: {
        width: '48%',
    },
    cuisineCard: {
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 14,
        minHeight: 86,
        justifyContent: 'center',
    },
    cuisineTitle: {
        fontSize: 20,
        marginBottom: 4,
    },
    cuisineCount: {
        fontSize: 14,
    },
});
