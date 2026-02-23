import { Bookmark, Lock, Plus, Sticker } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        icon: Sticker,
        locked: true,
    },
];

export const ListsScreen = () => {
    const { theme, typography } = useTheme();
    const insets = useSafeAreaInsets();
    const headerHeight = 64 + insets.top;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 16 }]}
                showsVerticalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                bounces={false}
            >
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>Listelerim</Text>
                    <TouchableOpacity activeOpacity={0.8}>
                        <View style={styles.addButton}>
                            <Plus size={26} color={colors.warmWhite} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.grid}>
                    {LISTS.map((list) => {
                        const Icon = list.icon;
                        return (
                            <TouchableOpacity key={list.id} activeOpacity={0.8} style={styles.gridItem}>
                                <GlassCard style={styles.listCard}>
                                    <View style={styles.cardTopRow}>
                                        <Icon size={34} color={colors.oliveLight} />
                                        {list.locked && (
                                            <View style={styles.lockBadge}>
                                                <Lock size={12} color={colors.oliveLight} />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                        {list.title}
                                    </Text>
                                    <Text style={[styles.cardSubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                        {list.subtitle}
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
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    title: {
        fontSize: 40,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.saffron,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0A6C40',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%',
    },
    listCard: {
        borderRadius: 16,
        minHeight: 184,
        padding: 14,
        justifyContent: 'space-between',
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    lockBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(13,120,68,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 28,
    },
    cardSubtitle: {
        fontSize: 16,
    },
});
