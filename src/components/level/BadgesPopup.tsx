import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import {
    Award,
    Bookmark,
    BookOpen,
    CalendarCheck,
    Camera,
    Crown,
    Flame,
    Globe,
    GraduationCap,
    Heart,
    Link2,
    Lock,
    Megaphone,
    MessageCircle,
    Mic2,
    Moon,
    Search,
    TrendingUp,
    UserCheck,
    Users,
    Video,
    Zap,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { BADGE_GROUP_LABELS } from '../../constants/badges';
import { ProfileBadge } from '../../hooks/useBadges';
import { useTheme } from '../../theme/ThemeProvider';
import { BadgeGroup } from '../../types/badge.types';

const { width } = Dimensions.get('window');
const BADGE_ITEM_SIZE = (width - 48 - 24) / 4;

// ─── Icon Registry ────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
    MessageCircle: MessageCircle,
    Camera: Camera,
    Heart: Heart,
    Bookmark: Bookmark,
    UserCheck: UserCheck,
    Flame: Flame,
    Globe: Globe,
    BookOpen: BookOpen,
    Moon: Moon,
    Link2: Link2,
    Mic2: Mic2,
    Users: Users,
    Megaphone: Megaphone,
    GraduationCap: GraduationCap,
    TrendingUp: TrendingUp,
    Zap: Zap,
    CalendarCheck: CalendarCheck,
    Search: Search,
    Video: Video,
    Crown: Crown,
    Award: Award,
};

// Gold palette
const GOLD = '#D4A829';
const GOLD_LIGHT = '#F5D060';
const GOLD_DIM = 'rgba(212,168,41,0.35)';
const GRAY_DIM = 'rgba(255,255,255,0.1)';

// ─── Laurel Wreath Frame ──────────────────────────────────
const LaurelWreathFrame = ({
    size,
    earned,
    children,
}: {
    size: number;
    earned: boolean;
    children: React.ReactNode;
}) => {
    const cx = size / 2;
    const wreathR = size * 0.43;
    const leafW = size * 0.105;
    const leafH = size * 0.046;
    const leafBorderRadius = leafW * 0.5;

    const primaryColor = earned ? GOLD : GRAY_DIM;
    const accentColor = earned ? GOLD_LIGHT : 'rgba(255,255,255,0.06)';

    const NUM_LEAVES = 20;
    const gapDeg = 14;
    const startDeg = 90 + gapDeg;
    const endDeg = 90 - gapDeg + 360;

    const leaves: { angle: number }[] = [];
    for (let i = 0; i <= NUM_LEAVES; i++) {
        const t = i / NUM_LEAVES;
        const deg = startDeg + t * (endDeg - startDeg);
        leaves.push({ angle: deg });
    }

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {earned && (
                <View
                    style={{
                        position: 'absolute',
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: 1,
                        borderColor: GOLD_DIM,
                        opacity: 0.6,
                    }}
                />
            )}

            {leaves.map((leaf, i) => {
                const rad = (leaf.angle * Math.PI) / 180;
                const offset = i % 2 === 0 ? 0 : size * 0.018;
                const adjustedX = cx + (wreathR + offset) * Math.cos(rad);
                const adjustedY = cx + (wreathR + offset) * Math.sin(rad);

                return (
                    <View
                        key={i}
                        style={{
                            position: 'absolute',
                            width: leafW,
                            height: leafH,
                            borderRadius: leafBorderRadius,
                            backgroundColor: i % 2 === 0 ? primaryColor : accentColor,
                            left: adjustedX - leafW / 2,
                            top: adjustedY - leafH / 2,
                            transform: [{ rotate: `${leaf.angle + 90}deg` }],
                        }}
                    />
                );
            })}

            <View
                style={{
                    position: 'absolute',
                    width: size * 0.62,
                    height: size * 0.62,
                    borderRadius: size * 0.31,
                    backgroundColor: earned
                        ? 'rgba(212, 168, 41, 0.08)'
                        : 'rgba(255,255,255,0.03)',
                    borderWidth: 1.5,
                    borderColor: earned ? GOLD_DIM : 'rgba(255,255,255,0.07)',
                }}
            />

            {earned && (
                <View
                    style={{
                        position: 'absolute',
                        top: size * 0.04,
                        left: cx - size * 0.018,
                        width: size * 0.036,
                        height: size * 0.036,
                        borderRadius: size * 0.018,
                        backgroundColor: GOLD_LIGHT,
                    }}
                />
            )}

            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </View>
        </View>
    );
};

// ─── Badge Icon with Wreath ───────────────────────────────
const BadgeWreath = ({
    badge,
    size = 68,
    iconSize = 22,
    earned = true,
}: {
    badge: ProfileBadge;
    size?: number;
    iconSize?: number;
    earned?: boolean;
}) => {
    const IconComponent = ICON_MAP[badge.icon] || Award;

    return (
        <LaurelWreathFrame size={size} earned={earned}>
            {earned ? (
                <MotiView
                    from={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', delay: 120 }}
                >
                    <IconComponent
                        size={iconSize}
                        color={badge.iconColor}
                        strokeWidth={1.7}
                    />
                </MotiView>
            ) : (
                <Lock size={iconSize * 0.8} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
            )}
        </LaurelWreathFrame>
    );
};

interface BadgesPopupProps {
    visible: boolean;
    onClose: () => void;
    badges: ProfileBadge[];
    highlightBadgeId?: string;
}

/* ─── Single Badge Item ──────────────────────────────────── */
const BadgeItem = ({ badge, index, onPress }: {
    badge: ProfileBadge;
    index: number;
    onPress: (b: ProfileBadge) => void;
}) => {
    const { theme, typography } = useTheme();

    return (
        <MotiView
            from={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: index * 45, damping: 16 }}
            style={styles.badgeItemWrapper}
        >
            <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onPress(badge)}
                style={[
                    styles.badgeItem,
                    {
                        borderColor: badge.isEarned ? GOLD_DIM : 'rgba(255,255,255,0.06)',
                        backgroundColor: badge.isEarned ? 'rgba(212,168,41,0.06)' : 'rgba(255,255,255,0.02)',
                    },
                ]}
            >
                {badge.isEarned && (
                    <View style={[styles.glowDot, { backgroundColor: GOLD }]} />
                )}

                <BadgeWreath badge={badge} size={60} iconSize={19} earned={badge.isEarned} />

                <Text
                    style={[
                        styles.badgeName,
                        {
                            color: badge.isEarned ? theme.text : theme.secondaryText,
                            fontFamily: typography.bodyMedium,
                            opacity: badge.isEarned ? 1 : 0.35,
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

/* ─── Badge Detail Overlay ───────────────────────────────── */
const BadgeDetailOverlay = ({ badge, onClose }: { badge: ProfileBadge | null; onClose: () => void }) => {
    const { theme, isDark, typography } = useTheme();
    if (!badge) return null;

    return (
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.detailOverlay}>
            <MotiView
                from={{ scale: 0.88, opacity: 0, translateY: 14 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                exit={{ scale: 0.88, opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                style={[
                    styles.detailCard,
                    {
                        backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                        borderColor: badge.isEarned ? GOLD_DIM : 'rgba(255,255,255,0.09)',
                    },
                ]}
            >
                <TouchableOpacity activeOpacity={1}>
                    <View style={styles.detailCloseRow}>
                        <View style={[styles.detailStatusPill, {
                            backgroundColor: badge.isEarned
                                ? 'rgba(212,168,41,0.14)'
                                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                        }]}>
                            <Text style={[styles.detailStatusText, {
                                color: badge.isEarned ? GOLD : theme.secondaryText,
                                fontFamily: typography.bodyMedium,
                            }]}>
                                {badge.isEarned ? '✓ Kazanıldı' : '🔒 Kilitli'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.detailCloseBtn}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Text style={{ color: theme.secondaryText, fontSize: 22, lineHeight: 24 }}>×</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailWreathWrap}>
                        {badge.isEarned && (
                            <View style={[styles.detailGlow, { backgroundColor: GOLD, opacity: 0.12 }]} />
                        )}
                        <BadgeWreath badge={badge} size={130} iconSize={44} earned={badge.isEarned} />
                    </View>

                    <Text style={[styles.detailName, { color: theme.text, fontFamily: typography.display }]}>
                        {badge.name}
                    </Text>

                    {badge.isEarned && (
                        <Text style={[styles.detailTitle, { color: GOLD, fontFamily: typography.body }]}>
                            {badge.title}
                        </Text>
                    )}

                    <View style={[styles.conditionBox, {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        borderColor: badge.isEarned ? GOLD_DIM : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'),
                    }]}>
                        <Text style={[styles.conditionLabel, {
                            color: badge.isEarned ? GOLD : theme.secondaryText,
                            fontFamily: typography.bodyMedium,
                        }]}>
                            {badge.isEarned ? 'NASIL KAZANDIN' : 'NASIL KAZANILIR'}
                        </Text>
                        <Text style={[styles.conditionText, { color: theme.text, fontFamily: typography.body }]}>
                            {badge.description}
                        </Text>
                    </View>

                    <View style={[styles.xpBadge, { backgroundColor: 'rgba(212,168,41,0.12)' }]}>
                        <Text style={[styles.xpText, { color: GOLD, fontFamily: typography.mono }]}>
                            +{badge.xpReward} XP
                        </Text>
                    </View>

                    {badge.isEarned && badge.earnedAt && (
                        <Text style={[styles.detailDate, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            🎉 {new Date(badge.earnedAt).toLocaleDateString('tr-TR', {
                                year: 'numeric', month: 'long', day: 'numeric',
                            })} tarihinde kazanıldı
                        </Text>
                    )}

                    {!badge.isEarned && (
                        <Text style={[styles.detailHint, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Bu rozeti tamamlamak için görevi yerine getir
                        </Text>
                    )}
                </TouchableOpacity>
            </MotiView>
        </TouchableOpacity>
    );
};

/* ─── Main Popup ─────────────────────────────────────────── */
export const BadgesPopup: React.FC<BadgesPopupProps> = ({ visible, onClose, badges, highlightBadgeId }) => {
    const { theme, isDark, typography } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['85%'], []);
    const [selectedBadge, setSelectedBadge] = useState<ProfileBadge | null>(null);

    useEffect(() => {
        if (visible && highlightBadgeId) {
            const target = badges.find(b => b.id === highlightBadgeId);
            if (target) {
                setSelectedBadge(target);
            }
        }
    }, [visible, highlightBadgeId, badges]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} onPress={onClose} />
        ),
        [onClose]
    );

    const renderBackground = useCallback(
        () => (
            <View style={StyleSheet.absoluteFill}>
                <View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}>
                    <BlurView
                        intensity={isDark ? 70 : 90}
                        tint={isDark ? 'dark' : 'light'}
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)',
                            },
                        ]}
                    />
                </View>
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            borderRadius: 32,
                            borderWidth: 1.5,
                            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                        }
                    ]}
                />
            </View>
        ),
        [isDark]
    );

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
                handleIndicatorStyle={{ backgroundColor: isDark ? GOLD_DIM : 'rgba(0,0,0,0.15)', width: 36 }}
            >
                <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                            Rozetler
                        </Text>
                        <View style={[styles.progressPill, { backgroundColor: 'rgba(212,168,41,0.12)', borderColor: GOLD_DIM, borderWidth: 1 }]}>
                            <Text style={[styles.progressText, { color: GOLD, fontFamily: typography.mono }]}>
                                {earnedCount}/{badges.length}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.subtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Başarımlarını tamamla, rozetlerini topla
                    </Text>

                    {groupedBadges.map((section) => (
                        <View key={section.group} style={styles.groupSection}>
                            <View style={styles.groupHeader}>
                                <View style={[styles.groupDivider, { backgroundColor: isDark ? 'rgba(212,168,41,0.18)' : 'rgba(0,0,0,0.06)' }]} />
                                <Text style={[styles.groupLabel, { color: isDark ? GOLD_DIM : theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                    {section.label}
                                </Text>
                                <View style={[styles.groupDivider, { backgroundColor: isDark ? 'rgba(212,168,41,0.18)' : 'rgba(0,0,0,0.06)' }]} />
                            </View>
                            <View style={styles.badgeGrid}>
                                {section.badges.map((badge, i) => (
                                    <BadgeItem key={badge.id} badge={badge} index={i} onPress={setSelectedBadge} />
                                ))}
                            </View>
                        </View>
                    ))}

                    {badges.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                Henüz bir rozet mevcut değil.
                            </Text>
                        </View>
                    )}
                </BottomSheetScrollView>
            </BottomSheet>

            {selectedBadge && (
                <BadgeDetailOverlay badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
            )}
        </Portal>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 22,
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
        letterSpacing: 0.4,
    },
    progressPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    progressText: {
        fontSize: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13,
        opacity: 0.65,
        marginBottom: 20,
    },
    groupSection: {
        marginBottom: 14,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    groupDivider: {
        flex: 1,
        height: 1,
    },
    groupLabel: {
        fontSize: 10,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badgeItemWrapper: {
        width: BADGE_ITEM_SIZE,
    },
    badgeItem: {
        borderRadius: 20,
        borderWidth: 1.5,
        paddingVertical: 8,
        paddingHorizontal: 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: 100,
    },
    badgeName: {
        fontSize: 9,
        textAlign: 'center',
        lineHeight: 12,
        paddingHorizontal: 4,
    },
    glowDot: {
        position: 'absolute',
        top: 6,
        right: 7,
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    detailOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    detailCard: {
        width: width * 0.84,
        borderRadius: 30,
        borderWidth: 1.5,
        padding: 24,
        alignItems: 'center',
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 14,
    },
    detailCloseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    detailStatusPill: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    detailStatusText: {
        fontSize: 11,
        letterSpacing: 0.3,
    },
    detailCloseBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailWreathWrap: {
        position: 'relative',
        marginBottom: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailGlow: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        zIndex: -1,
    },
    detailName: {
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 4,
    },
    detailTitle: {
        fontSize: 13,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 14,
        opacity: 0.9,
    },
    conditionBox: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 14,
        marginBottom: 14,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    conditionLabel: {
        fontSize: 9,
        letterSpacing: 1.2,
        marginBottom: 6,
        opacity: 0.85,
    },
    conditionText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    xpBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 10,
    },
    xpText: {
        fontSize: 13,
        letterSpacing: 0.5,
    },
    detailDate: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.55,
        marginTop: 4,
    },
    detailHint: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.45,
        fontStyle: 'italic',
        marginTop: 4,
    },
    emptyState: {
        paddingVertical: 50,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        opacity: 0.5,
    },
});
