import { Apple, CalendarDays, Fish, Leaf } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MONTH_NAMES, SeasonalFood, seasonService } from '../../api/seasonService';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassCard } from '../glass/GlassCard';


const TYPE_CONFIG = {
    vegetable: { label: 'Sebzeler', icon: Leaf, color: colors.mintFresh, bgColor: 'rgba(52,211,153,0.12)' },
    fruit: { label: 'Meyveler', icon: Apple, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
    fish: { label: 'Balıklar', icon: Fish, color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)' },
};

export const SeasonalCompass = () => {
    const { theme, isDark, typography } = useTheme();
    const currentMonth = new Date().getMonth() + 1;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const seasonName = seasonService.getSeasonForMonth(selectedMonth);
    const seasonColor = seasonService.getSeasonColor(seasonName);
    const seasonEmoji = seasonService.getSeasonEmoji(seasonName);
    const foodsByType = seasonService.getFoodsByTypeForMonth(selectedMonth);

    const handleMonthChange = (month: number) => {
        setSelectedMonth(month);
    };

    const renderFoodItem = (item: SeasonalFood, index: number) => {
        const config = TYPE_CONFIG[item.type];
        return (
            <MotiView
                key={item.name + selectedMonth}
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300, delay: index * 60 }}
                style={[styles.foodChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
            >
                <Text style={styles.foodEmoji}>{item.emoji}</Text>
                <View style={styles.foodChipText}>
                    <Text style={[styles.foodName, { color: theme.text, fontFamily: typography.bodyMedium }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.foodDesc, { color: theme.secondaryText, fontFamily: typography.body }]} numberOfLines={1}>
                        {item.description}
                    </Text>
                </View>
            </MotiView>
        );
    };

    const renderSection = (type: 'vegetable' | 'fruit' | 'fish', items: SeasonalFood[]) => {
        if (items.length === 0) return null;
        const config = TYPE_CONFIG[type];
        const Icon = config.icon;

        return (
            <View style={styles.categorySection} key={type}>
                <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: config.bgColor }]}>
                        <Icon size={14} color={config.color} />
                    </View>
                    <Text style={[styles.categoryTitle, { color: config.color, fontFamily: typography.bodyMedium }]}>
                        {config.label}
                    </Text>
                    <View style={[styles.categoryCount, { backgroundColor: config.bgColor }]}>
                        <Text style={[styles.categoryCountText, { color: config.color }]}>
                            {items.length}
                        </Text>
                    </View>
                </View>
                <View style={styles.foodGrid}>
                    {items.map((item, index) => renderFoodItem(item, index))}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <View style={[styles.compassIcon, { backgroundColor: `${colors.saffron}15` }]}>
                        <CalendarDays size={20} color={colors.saffron} />
                    </View>
                    <View>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                            Mevsim Takvimi
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Mevsiminde ye, sağlıklı yaşa
                        </Text>
                    </View>
                </View>
                <View style={[styles.seasonBadge, { backgroundColor: `${seasonColor}18` }]}>
                    <Text style={styles.seasonEmoji}>{seasonEmoji}</Text>
                    <Text style={[styles.seasonText, { color: seasonColor, fontFamily: typography.bodyMedium }]}>{seasonName}</Text>
                </View>
            </View>

            {/* Month Selector - Calendar Strip */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthStrip}
                decelerationRate="fast"
            >
                {MONTH_NAMES.map((name, index) => {
                    const month = index + 1;
                    const isSelected = month === selectedMonth;
                    const isCurrent = month === currentMonth;
                    const monthSeason = seasonService.getSeasonForMonth(month);
                    const monthColor = seasonService.getSeasonColor(monthSeason);

                    return (
                        <TouchableOpacity
                            key={month}
                            onPress={() => handleMonthChange(month)}
                            activeOpacity={0.7}
                            style={[
                                styles.monthItem,
                                isSelected && { backgroundColor: `${monthColor}20`, borderColor: monthColor },
                                !isSelected && { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                            ]}
                        >
                            {isCurrent && (
                                <View style={[styles.currentDot, { backgroundColor: colors.saffron }]} />
                            )}
                            <Text style={[
                                styles.monthNumber,
                                { color: isSelected ? monthColor : theme.secondaryText, fontFamily: typography.mono }
                            ]}>
                                {month < 10 ? `0${month}` : month}
                            </Text>
                            <Text style={[
                                styles.monthName,
                                { color: isSelected ? theme.text : theme.secondaryText, fontFamily: isSelected ? typography.bodyMedium : typography.body }
                            ]}>
                                {name.slice(0, 3)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Selected Month Content */}
            <GlassCard style={styles.contentCard}>
                <View style={styles.contentHeader}>
                    <Text style={[styles.contentTitle, { color: theme.text, fontFamily: typography.display }]}>
                        {MONTH_NAMES[selectedMonth - 1]}
                    </Text>
                    <Text style={[styles.contentSubtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Bu ay {seasonService.getFoodsForMonth(selectedMonth).length} ürün taze tüketilebilir.
                    </Text>
                </View>

                {renderSection('vegetable', foodsByType.vegetables)}
                {renderSection('fruit', foodsByType.fruits)}
                {renderSection('fish', foodsByType.fish)}

                {seasonService.getFoodsForMonth(selectedMonth).length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={{ fontSize: 32 }}>🍽️</Text>
                        <Text style={[{ color: theme.secondaryText, fontFamily: typography.body, marginTop: 8, fontSize: 13 }]}>
                            Bu ay için veri eklenmemiş.
                        </Text>
                    </View>
                )}
            </GlassCard>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 16,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    compassIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
    },
    subtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    seasonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 4,
    },
    seasonEmoji: {
        fontSize: 14,
    },
    seasonText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Month Strip
    monthStrip: {
        paddingHorizontal: 4,
        paddingBottom: 4,
        gap: 6,
    },
    monthItem: {
        width: 52,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        position: 'relative',
    },
    currentDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    monthNumber: {
        fontSize: 16,
        marginBottom: 2,
    },
    monthName: {
        fontSize: 10,
    },
    // Content
    contentCard: {
        marginTop: 16,
        padding: 4,
    },
    contentHeader: {
        marginBottom: 16,
    },
    contentTitle: {
        fontSize: 22,
    },
    contentSubtitle: {
        fontSize: 12,
        marginTop: 4,
    },
    // Category Sections
    categorySection: {
        marginBottom: 16,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    categoryIcon: {
        width: 28,
        height: 28,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryTitle: {
        fontSize: 13,
        flex: 1,
    },
    categoryCount: {
        width: 22,
        height: 22,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryCountText: {
        fontSize: 11,
        fontWeight: '700',
    },
    foodGrid: {
        gap: 6,
    },
    foodChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        gap: 10,
    },
    foodEmoji: {
        fontSize: 22,
    },
    foodChipText: {
        flex: 1,
    },
    foodName: {
        fontSize: 14,
        marginBottom: 2,
    },
    foodDesc: {
        fontSize: 11,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
});
