import { useNavigation } from '@react-navigation/native';
import { Bookmark, Lock, Plus, Star } from 'lucide-react-native';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/glass/GlassCard';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const LISTS = [
    {
        id: 'saved',
        title: 'Kaydedilenler',
        subtitle: 'Tüm favoriler',
        icon: Bookmark,
    },
    {
        id: 'favorites',
        title: 'Favoriler',
        subtitle: '1 video',
        icon: Star,
        locked: true,
    },
];

export const ListsScreen = () => {
    const { theme, isDark, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const headerHeight = 52 + insets.top;

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
                    <TouchableOpacity activeOpacity={0.7}>
                        <View style={styles.addButton}>
                            <Plus size={20} color={colors.warmWhite} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.grid}>
                    {LISTS.map((list) => {
                        const Icon = list.icon;
                        return (
                            <TouchableOpacity key={list.id} activeOpacity={0.7} style={styles.gridItem}>
                                <GlassCard style={styles.listCard}>
                                    <View style={styles.cardTopRow}>
                                        <View style={[styles.iconWrap, {
                                            backgroundColor: isDark ? 'rgba(20,133,74,0.15)' : 'rgba(20,133,74,0.08)',
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
                                            {list.subtitle}
                                        </Text>
                                    </View>
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
        borderRadius: 12,
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
        borderRadius: 8,
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
