import {
    Award,
    ShieldCheck,
    TrendingUp,
    Trophy,
    Zap
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { ProfileBadge } from '../../hooks/useBadges';
import { LEVEL_COLORS } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassCard } from '../glass/GlassCard';
import { AbilitiesPopup } from './AbilitiesPopup';
import { BadgesPopup } from './BadgesPopup';
import { LeaderboardPopup } from './LeaderboardPopup';
import { XPBar } from './XPBar';

interface AnimatedLevelCardProps {
    level: number;
    xp: number;
    xpNext: number;
    levelName: string;
    streak?: number;
    weeklyXp?: number;
    mini?: boolean;
    rank?: number;
    badges?: ProfileBadge[];
    initialShowBadges?: boolean;
    highlightBadgeId?: string;
}

export const AnimatedLevelCard: React.FC<AnimatedLevelCardProps> = ({
    level,
    xp,
    xpNext,
    levelName,
    streak = 0,
    weeklyXp = 0,
    mini = false,
    rank = 0,
    badges = [],
    initialShowBadges = false,
    highlightBadgeId,
}) => {
    const { theme, typography } = useTheme();
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showAbilities, setShowAbilities] = useState(false);
    const [showBadges, setShowBadges] = useState(initialShowBadges);

    React.useEffect(() => {
        if (initialShowBadges) {
            setShowBadges(true);
        }
    }, [initialShowBadges]);

    const badgeScale = useSharedValue(1);
    const auraScale = useSharedValue(1);
    const auraOpacity = useSharedValue(0.1);

    React.useEffect(() => {
        badgeScale.value = withRepeat(
            withSequence(withTiming(1.06, { duration: 1000 }), withTiming(1.0, { duration: 1000 })),
            -1,
            false
        );
        auraScale.value = withRepeat(
            withSequence(withTiming(1.2, { duration: 2000 }), withTiming(1.0, { duration: 2000 })),
            -1,
            false
        );
        auraOpacity.value = withRepeat(
            withSequence(withTiming(0.2, { duration: 2000 }), withTiming(0.1, { duration: 2000 })),
            -1,
            false
        );
    }, []);

    const auraStyle = useAnimatedStyle(() => ({
        transform: [{ scale: auraScale.value }],
        opacity: auraOpacity.value,
    }));

    const badgeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: badgeScale.value }],
    }));

    const percent = Math.round((xp / xpNext) * 100);
    const levelColors = LEVEL_COLORS[level] || LEVEL_COLORS[1];

    if (mini) {
        return (
            <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.container}
            >
                <GlassCard style={styles.miniCard}>
                    <View style={styles.miniHeader}>
                        <View style={[styles.badge, { width: 32, height: 32, backgroundColor: `${levelColors.primary}20` }]}>
                            <Award color={levelColors.primary} size={16} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={[styles.miniLevelName, { color: levelColors.primary, fontFamily: typography.display }]}>
                                    {levelName}
                                </Text>
                                <Text style={[styles.miniLevelLabel, { color: theme.secondaryText, fontFamily: typography.mono }]}>
                                    Lv.{level}
                                </Text>
                            </View>
                            <View style={{ marginTop: 4 }}>
                                <XPBar xp={xp} xpNext={xpNext} />
                            </View>
                        </View>
                    </View>
                </GlassCard>
            </MotiView>
        );
    }

    return (
        <>
            <MotiView
                from={{ opacity: 0, scale: 0.98, translateY: 10 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                style={styles.container}
            >
                <GlassCard style={styles.cardContent}>
                    <Animated.View style={[styles.aura, auraStyle, { backgroundColor: levelColors.primary }]} />

                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Zap color={levelColors.primary} size={14} fill={levelColors.primary} />
                            <Text style={[styles.levelLabel, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                SEVİYE {level}
                            </Text>
                        </View>
                        <Animated.View style={badgeStyle}>
                            <TouchableOpacity style={[styles.badge, { backgroundColor: `${levelColors.primary}15` }]} onPress={() => setShowBadges(true)}>
                                <Trophy color={levelColors.primary} size={20} />
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    <Text style={[styles.levelName, { color: theme.text, fontFamily: typography.display }]}>
                        {levelName}
                    </Text>

                    <View style={styles.xpSection}>
                        <View style={styles.xpLabels}>
                            <Text style={[styles.xpText, { color: theme.secondaryText, fontFamily: typography.mono }]}>
                                {xp.toLocaleString()} / {xpNext.toLocaleString()} XP
                            </Text>
                            <Text style={[styles.percentText, { color: colors.saffron, fontFamily: typography.mono }]}>
                                {percent}%
                            </Text>
                        </View>
                        <XPBar xp={xp} xpNext={xpNext} />
                    </View>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionChip} onPress={() => setShowAbilities(true)}>
                            <ShieldCheck size={16} color={colors.saffron} />
                            <Text style={[styles.actionText, { color: theme.text, fontFamily: typography.bodyMedium }]}>Yetenekler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionChip} onPress={() => setShowBadges(true)}>
                            <Award size={16} color={colors.saffron} />
                            <Text style={[styles.actionText, { color: theme.text, fontFamily: typography.bodyMedium }]}>Rozetler</Text>
                            {badges.filter(b => b.isEarned).length > 0 && (
                                <View style={styles.badgeCount}>
                                    <Text style={styles.badgeCountText}>{badges.filter(b => b.isEarned).length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionChip} onPress={() => setShowLeaderboard(true)}>
                            <TrendingUp size={16} color={colors.saffron} />
                            <Text style={[styles.actionText, { color: theme.text, fontFamily: typography.bodyMedium }]}>Sıralama</Text>
                        </TouchableOpacity>
                    </View>
                </GlassCard>
            </MotiView>

            <LeaderboardPopup visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
            <AbilitiesPopup
                visible={showAbilities}
                onClose={() => setShowAbilities(false)}
                level={level}
            />
            <BadgesPopup
                visible={showBadges}
                onClose={() => setShowBadges(false)}
                badges={badges}
                highlightBadgeId={highlightBadgeId}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 10,
    },
    cardContent: {
        padding: 24,
        borderRadius: 32,
        overflow: 'hidden',
    },
    miniCard: {
        padding: 12,
        borderRadius: 20,
    },
    aura: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 250,
        height: 250,
        borderRadius: 125,
        opacity: 0.1,
        zIndex: -1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    levelLabel: {
        fontSize: 10,
        letterSpacing: 1.5,
        opacity: 0.7,
    },
    badge: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelName: {
        fontSize: 32,
        marginBottom: 20,
    },
    xpSection: {
        marginBottom: 24,
    },
    xpLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    xpText: {
        fontSize: 12,
        opacity: 0.7,
    },
    percentText: {
        fontSize: 14,
        opacity: 0.9,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    actionText: {
        fontSize: 11,
    },
    badgeCount: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.saffron,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeCountText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    miniHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniLevelName: {
        fontSize: 15,
    },
    miniLevelLabel: {
        fontSize: 11,
    },
});
