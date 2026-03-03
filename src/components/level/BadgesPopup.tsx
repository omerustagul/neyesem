import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { BADGE_GROUP_LABELS } from '../../constants/badges';
import { ProfileBadge } from '../../hooks/useBadges';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { BadgeGroup } from '../../types/badge.types';

const { width } = Dimensions.get('window');
const BADGE_ITEM_SIZE = (width - 48 - 24) / 4; // 4 per row, 24px padding each side, 8px gaps

interface BadgesPopupProps {
    visible: boolean;
    onClose: () => void;
    badges: ProfileBadge[];
}

/* ─── Single Badge Item ─────────────────────────────────── */
const BadgeItem = ({ badge, index, onPress }: { badge: ProfileBadge; index: number; onPress: (b: ProfileBadge) => void }) => {
    const { theme, isDark, typography } = useTheme();

    return (
        <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: index * 40, damping: 18 }}
            style={styles.badgeItemWrapper}
        >
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onPress(badge)}
                style={[
                    styles.badgeItem,
                    {
                        backgroundColor: badge.isEarned
                            ? (isDark ? 'rgba(20, 133, 74, 0.12)' : 'rgba(20, 133, 74, 0.08)')
                            : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                        borderColor: badge.isEarned
                            ? (isDark ? 'rgba(20, 133, 74, 0.3)' : 'rgba(20, 133, 74, 0.2)')
                            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    },
                ]}
            >
                {/* Earned glow dot */}
                {badge.isEarned && (
                    <View style={styles.glowDot} />
                )}

                {/* Emoji / Lock */}
                <Text style={[
                    styles.badgeEmoji,
                    !badge.isEarned && { opacity: 0.35 },
                ]}>
                    {badge.isEarned ? badge.emoji : ''}
                </Text>
                {!badge.isEarned && (
                    <View style={styles.lockOverlay}>
                        <Lock size={16} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'} />
                    </View>
                )}

                {/* Name */}
                <Text
                    style={[
                        styles.badgeName,
                        {
                            color: badge.isEarned ? theme.text : theme.secondaryText,
                            fontFamily: typography.bodyMedium,
                            opacity: badge.isEarned ? 1 : 0.45,
                        },
                    ]}
                    numberOfLines={2}
                >
                    {badge.name}
                </Text>
            </TouchableOpacity>
        </MotiView>
    );
};

/* ─── Badge Detail Sheet ────────────────────────────────── */
const BadgeDetailOverlay = ({ badge, onClose }: { badge: ProfileBadge | null; onClose: () => void }) => {
    const { theme, isDark, typography } = useTheme();
    if (!badge) return null;

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onClose}
            style={styles.detailOverlay}
        >
            <MotiView
                from={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                style={[
                    styles.detailCard,
                    {
                        backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                        borderColor: badge.isEarned
                            ? (isDark ? 'rgba(20, 133, 74, 0.4)' : 'rgba(20, 133, 74, 0.25)')
                            : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
                    },
                ]}
            >
                <TouchableOpacity activeOpacity={1}>
                    {/* Big Emoji */}
                    <Text style={styles.detailEmoji}>
                        {badge.isEarned ? badge.emoji : '🔒'}
                    </Text>

                    {/* Name */}
                    <Text style={[styles.detailName, { color: theme.text, fontFamily: typography.display }]}>
                        {badge.name}
                    </Text>

                    {/* Title */}
                    {badge.isEarned && (
                        <Text style={[styles.detailTitle, { color: colors.saffron }]}>
                            {badge.title}
                        </Text>
                    )}

                    {/* Description */}
                    <Text style={[styles.detailDescription, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        {badge.description}
                    </Text>

                    {/* XP Reward */}
                    <View style={[styles.xpBadge, { backgroundColor: `${colors.saffron}15` }]}>
                        <Text style={[styles.xpText, { color: colors.saffron, fontFamily: typography.mono }]}>
                            +{badge.xpReward} XP
                        </Text>
                    </View>

                    {/* Earned date */}
                    {badge.isEarned && badge.earnedAt && (
                        <Text style={[styles.detailDate, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            🎉 {new Date(badge.earnedAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </Text>
                    )}

                    {/* Not earned hint */}
                    {!badge.isEarned && (
                        <Text style={[styles.detailHint, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Bu rozeti henüz kazanmadın
                        </Text>
                    )}
                </TouchableOpacity>
            </MotiView>
        </TouchableOpacity>
    );
};

/* ─── Main Popup ────────────────────────────────────────── */
export const BadgesPopup: React.FC<BadgesPopupProps> = ({ visible, onClose, badges }) => {
    const { theme, isDark, typography } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['82%'], []);
    const [selectedBadge, setSelectedBadge] = useState<ProfileBadge | null>(null);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} onPress={onClose} />
        ),
        [onClose]
    );

    const renderBackground = useCallback(() => (
        <View style={StyleSheet.absoluteFill}>
            <BlurView
                intensity={isDark ? 60 : 90}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
                        borderRadius: 30,
                        overflow: 'hidden',
                        borderWidth: 1.5,
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                    }
                ]}
            />
        </View>
    ), [isDark]);

    // Group badges by category
    const groupedBadges = useMemo(() => {
        const groups: Record<string, ProfileBadge[]> = {};
        const groupOrder: BadgeGroup[] = ['baslangic', 'yemek_kulturu', 'sosyal', 'ustalik'];

        groupOrder.forEach(g => { groups[g] = []; });
        badges.forEach(b => {
            if (groups[b.group]) {
                groups[b.group].push(b);
            }
        });

        return groupOrder
            .filter(g => groups[g].length > 0)
            .map(g => ({
                group: g,
                label: BADGE_GROUP_LABELS[g] || g,
                badges: groups[g],
            }));
    }, [badges]);

    const earnedCount = badges.filter(b => b.isEarned).length;

    if (!visible) return null;

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                backgroundComponent={renderBackground}
                enablePanDownToClose
                onClose={onClose}
                backgroundStyle={{ backgroundColor: 'transparent' }}
                handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
            >
                <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                            🏅 Rozetler
                        </Text>
                        <View style={[styles.progressPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                            <Text style={[styles.progressText, { color: colors.saffron, fontFamily: typography.mono }]}>
                                {earnedCount}/{badges.length}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.subtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Başarımlarını tamamla, rozetlerini topla
                    </Text>

                    {/* Badge Groups */}
                    {groupedBadges.map((section) => (
                        <View key={section.group} style={styles.groupSection}>
                            <View style={styles.groupHeader}>
                                <View style={[styles.groupDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
                                <Text style={[styles.groupLabel, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                    {section.label}
                                </Text>
                                <View style={[styles.groupDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
                            </View>
                            <View style={styles.badgeGrid}>
                                {section.badges.map((badge, i) => (
                                    <BadgeItem
                                        key={badge.id}
                                        badge={badge}
                                        index={i}
                                        onPress={setSelectedBadge}
                                    />
                                ))}
                            </View>
                        </View>
                    ))}

                    {badges.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Henüz bir rozet mevcut değil.</Text>
                        </View>
                    )}
                </BottomSheetScrollView>
            </BottomSheet>

            {/* Badge Detail Overlay */}
            {selectedBadge && (
                <BadgeDetailOverlay badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
            )}
        </Portal>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 24,
        paddingBottom: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        marginTop: 8,
    },
    title: {
        fontSize: 22,
        letterSpacing: 0.5,
    },
    progressPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    progressText: {
        fontSize: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13,
        opacity: 0.7,
        marginBottom: 20,
    },

    // Group
    groupSection: {
        marginBottom: 16,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    groupDivider: {
        flex: 1,
        height: 1,
    },
    groupLabel: {
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
        opacity: 0.7,
    },

    // Badge Grid — 4 per row
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badgeItemWrapper: {
        width: BADGE_ITEM_SIZE,
    },
    badgeItem: {
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 4,
        alignItems: 'center',
        minHeight: 80,
        justifyContent: 'center',
    },
    badgeEmoji: {
        fontSize: 22,
        marginBottom: 4,
        height: 28,
        textAlign: 'center',
    },
    lockOverlay: {
        position: 'absolute',
        top: 14,
    },
    badgeName: {
        fontSize: 9,
        textAlign: 'center',
        lineHeight: 12,
    },
    glowDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#14854A',
    },

    // Detail overlay
    detailOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    detailCard: {
        width: width * 0.78,
        borderRadius: 24,
        borderWidth: 1.5,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    detailEmoji: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 12,
    },
    detailName: {
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 6,
    },
    detailTitle: {
        fontSize: 13,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 12,
    },
    detailDescription: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
        opacity: 0.8,
    },
    xpBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
    },
    xpText: {
        fontSize: 13,
        letterSpacing: 0.5,
    },
    detailDate: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.6,
        marginTop: 4,
    },
    detailHint: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.5,
        fontStyle: 'italic',
    },

    // Empty
    emptyState: {
        paddingVertical: 50,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        opacity: 0.5,
    },
});
