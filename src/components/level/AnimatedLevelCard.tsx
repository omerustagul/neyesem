import { Award, Check, Flame, Gift, Trophy, Zap } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassCard } from '../glass/GlassCard';
import { XPBar } from './XPBar';

const LEVEL_DATA = [
    { level: 1, name: 'Düz Yiyici', xpRequired: 0, reward: 'Temel Erişim' },
    { level: 2, name: 'Kaşıkçı', xpRequired: 150, reward: 'Yorum Yapma' },
    { level: 3, name: 'Ev Aşçısı', xpRequired: 400, reward: 'Liste Oluşturma' },
    { level: 4, name: 'Usta Çırak', xpRequired: 800, reward: 'Gönderi Paylaşma' },
    { level: 5, name: 'Sous Chef', xpRequired: 1500, reward: 'Hikaye Paylaşma' },
    { level: 6, name: 'Şef', xpRequired: 3000, reward: 'Rozet Sistemi' },
    { level: 7, name: 'Baş Şef', xpRequired: 5000, reward: 'Özel Filtreler' },
    { level: 8, name: 'Gastronom', xpRequired: 8000, reward: 'Gurme Rozeti' },
    { level: 9, name: 'Gurme', xpRequired: 12000, reward: 'Profil Efektleri' },
    { level: 10, name: 'Altın Çatal', xpRequired: 20000, reward: 'Tüm Özellikler' },
];

const LEVEL_COLORS: Record<number, { primary: string; secondary: string; light: string }> = {
    1: { primary: '#94a3b8', secondary: '#64748b', light: 'rgba(148,163,184,0.1)' },
    2: { primary: '#d97706', secondary: '#92400e', light: 'rgba(217,119,6,0.1)' },
    3: { primary: '#94a3b8', secondary: '#475569', light: 'rgba(148,163,184,0.15)' },
    4: { primary: '#fbbf24', secondary: '#b45309', light: 'rgba(251,191,36,0.15)' },
    5: { primary: '#2dd4bf', secondary: '#0f766e', light: 'rgba(45,212,191,0.15)' },
    6: { primary: '#10b981', secondary: '#047857', light: 'rgba(16,185,129,0.15)' },
    7: { primary: '#3b82f6', secondary: '#1d4ed8', light: 'rgba(59,130,246,0.15)' },
    8: { primary: '#8b5cf6', secondary: '#6d28d9', light: 'rgba(139,92,246,0.15)' },
    9: { primary: '#ef4444', secondary: '#b91c1c', light: 'rgba(239,68,68,0.15)' },
    10: { primary: '#f59e0b', secondary: '#d97706', light: 'rgba(245,158,11,0.2)' },
};

const Particle = ({ delay = 0, color }: { delay?: number, color: string }) => {
    const tx = useSharedValue(Math.random() * 200 - 100);
    const ty = useSharedValue(Math.random() * 100 - 50);
    const opacity = useSharedValue(0.1 + Math.random() * 0.4);
    const scale = useSharedValue(0.5 + Math.random() * 1);

    React.useEffect(() => {
        const duration = 3000 + Math.random() * 4000;
        tx.value = withRepeat(
            withTiming(Math.random() * 200 - 100, { duration }),
            -1,
            true
        );
        ty.value = withRepeat(
            withTiming(Math.random() * 100 - 50, { duration: duration * 1.2 }),
            -1,
            true
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: opacity.value,
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value }
        ],
    }));

    return <Animated.View style={style} />;
};

const FloatingParticles = ({ color }: { color: string }) => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {[...Array(6)].map((_, i) => (
                <Particle key={i} color={color} delay={i * 500} />
            ))}
        </View>
    );
};

interface AnimatedLevelCardProps {
    level: number;
    xp: number;
    xpNext: number;
    levelName: string;
    streak?: number;
    weeklyXp?: number;
    mini?: boolean;
}

export const AnimatedLevelCard: React.FC<AnimatedLevelCardProps> = ({
    level,
    xp,
    xpNext,
    levelName,
    streak = 0,
    weeklyXp = 0,
    mini = false,
}) => {
    const { theme, typography, isDark } = useTheme();
    const [showModal, setShowModal] = useState(false);

    // Badge pulse animation
    const badgeScale = useSharedValue(1);
    React.useEffect(() => {
        badgeScale.value = withRepeat(
            withSequence(
                withTiming(1.06, { duration: 1000 }),
                withTiming(1.0, { duration: 1000 }),
            ),
            -1,
            false,
        );
    }, []);

    const badgeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: badgeScale.value }],
    }));

    const percent = Math.round((xp / xpNext) * 100);
    const nextLevelData = LEVEL_DATA.find(l => l.level === level + 1);
    const levelColors = LEVEL_COLORS[level] || LEVEL_COLORS[1];

    return (
        <>
            <MotiView
                from={{ opacity: 0, scale: 0.95, translateY: 8 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: 'spring', delay: 200 }}
                style={styles.container}
            >
                <TouchableOpacity activeOpacity={0.85} onPress={() => setShowModal(true)}>
                    <GlassCard style={mini ? { paddingVertical: 12, paddingHorizontal: 16 } : undefined}>
                        {/* Gradient overlay based on level */}
                        <View style={[styles.gradientOverlay, {
                            backgroundColor: levelColors.light,
                        }]} />

                        {!mini && <FloatingParticles color={levelColors.primary} />}

                        {mini ? (
                            <View style={styles.miniContainer}>
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
                            </View>
                        ) : (
                            <>
                                {/* Header: Level label + Badge */}
                                <View style={styles.header}>
                                    <View style={styles.headerLeft}>
                                        <MotiView
                                            animate={{ rotate: '360deg' }}
                                            transition={{ loop: true, duration: 4000, type: 'timing' }}
                                        >
                                            <Zap color={levelColors.primary} size={14} fill={levelColors.primary} />
                                        </MotiView>
                                        <Text style={[styles.levelLabel, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                            SEVİYE {level}
                                        </Text>
                                    </View>
                                    <Animated.View style={badgeStyle}>
                                        <View style={[styles.badge, { backgroundColor: `${levelColors.primary}20` }]}>
                                            <Award color={levelColors.primary} size={20} />
                                        </View>
                                    </Animated.View>
                                </View>

                                {/* Level Name */}
                                <Text style={[styles.levelName, { color: levelColors.primary, fontFamily: typography.display }]}>
                                    {levelName}
                                </Text>

                                {/* XP Progress */}
                                <View style={styles.xpSection}>
                                    <View style={styles.xpLabels}>
                                        <Text style={[styles.xpText, { color: theme.secondaryText, fontFamily: typography.mono }]}>
                                            {xp.toLocaleString()} / {xpNext.toLocaleString()} XP
                                        </Text>
                                        <Text style={[styles.percentText, { color: levelColors.primary, fontFamily: typography.mono }]}>
                                            {percent}%
                                            {nextLevelData && (
                                                <Text style={{ color: theme.secondaryText, fontSize: 10 }}>
                                                    {' '}→ {nextLevelData.name}
                                                </Text>
                                            )}
                                        </Text>
                                    </View>
                                    <XPBar xp={xp} xpNext={xpNext} />
                                </View>

                                {/* Stats Row */}
                                <View style={styles.statsRow}>
                                    {streak > 0 && (
                                        <View style={[styles.statChip, { backgroundColor: `${levelColors.primary}12` }]}>
                                            <Flame size={14} color={colors.spiceRed} />
                                            <Text style={[styles.statText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                {streak} Günlük Seri
                                            </Text>
                                        </View>
                                    )}
                                    {weeklyXp > 0 && (
                                        <View style={[styles.statChip, { backgroundColor: `${levelColors.primary}12` }]}>
                                            <Zap size={14} color={levelColors.primary} />
                                            <Text style={[styles.statText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                                Bu Hafta: +{weeklyXp} XP
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={[styles.actionButton, { borderColor: theme.border }]}>
                                        <Award size={14} color={theme.text} />
                                        <Text style={[styles.actionText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                            Rozetlerim
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionButton, { borderColor: theme.border }]}>
                                        <Trophy size={14} color={theme.text} />
                                        <Text style={[styles.actionText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                            Sıralama
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </GlassCard>
                </TouchableOpacity>
            </MotiView>

            {/* Level Detail Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: theme.text, fontFamily: typography.display }]}>
                            Level Yolculuğun
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                            {LEVEL_DATA.map((item) => {
                                const isCurrent = item.level === level;
                                const isCompleted = item.level < level;
                                const isLocked = item.level > level;
                                const itemColors = LEVEL_COLORS[item.level] || LEVEL_COLORS[1];

                                return (
                                    <View key={item.level} style={styles.timelineItem}>
                                        <View style={styles.timelineLine}>
                                            <View style={[
                                                styles.timelineDot,
                                                {
                                                    backgroundColor: isCompleted ? itemColors.primary
                                                        : isCurrent ? itemColors.primary
                                                            : theme.border,
                                                    borderWidth: isCurrent ? 3 : 0,
                                                    borderColor: isCurrent ? `${itemColors.primary}40` : 'transparent',
                                                }
                                            ]}>
                                                {isCompleted && <Check size={10} color="#fff" strokeWidth={3} />}
                                                {isCurrent && <Trophy size={10} color="#fff" />}
                                            </View>
                                            {item.level < 10 && (
                                                <View style={[styles.timelineConnector, {
                                                    backgroundColor: isCompleted ? itemColors.primary : theme.border,
                                                }]} />
                                            )}
                                        </View>
                                        <View style={[
                                            styles.timelineContent,
                                            isCurrent && { borderColor: itemColors.primary, borderWidth: 1 },
                                            { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }
                                        ]}>
                                            <View style={styles.timelineHeader}>
                                                <Text style={[
                                                    styles.timelineLevelName,
                                                    {
                                                        color: isLocked ? theme.secondaryText : theme.text,
                                                        fontFamily: typography.bodyMedium,
                                                        opacity: isLocked ? 0.5 : 1,
                                                    }
                                                ]}>
                                                    Lv.{item.level} — {item.name}
                                                </Text>
                                                {isCurrent && (
                                                    <View style={[styles.currentBadge, { backgroundColor: itemColors.primary }]}>
                                                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>ŞİMDİ</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.rewardRow}>
                                                <Gift size={12} color={theme.secondaryText} style={{ opacity: isLocked ? 0.4 : 0.8 }} />
                                                <Text style={[styles.timelineReward, {
                                                    color: theme.secondaryText,
                                                    fontFamily: typography.body,
                                                    opacity: isLocked ? 0.4 : 0.8,
                                                }]}>
                                                    {item.reward}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        {nextLevelData && (
                            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                                <Text style={[styles.footerText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                                    Sonraki level ({nextLevelData.name}) için{' '}
                                    <Text style={{ color: levelColors.primary, fontWeight: '700' }}>
                                        {(xpNext - xp).toLocaleString()} XP
                                    </Text>
                                    {' '}kaldı!
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() => setShowModal(false)}
                            style={[styles.closeButton, { backgroundColor: levelColors.primary }]}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Harika</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 18,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    levelLabel: {
        fontSize: 11,
        letterSpacing: 2,
    },
    badge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(20,133,74,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelName: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 14,
    },
    xpSection: {
        marginBottom: 12,
    },
    xpLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    xpText: {
        fontSize: 11,
    },
    percentText: {
        fontSize: 11,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statText: {
        fontSize: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
    },
    actionText: {
        fontSize: 12,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 36,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(128,128,128,0.3)',
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalScroll: {
        flex: 1,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    timelineLine: {
        width: 28,
        alignItems: 'center',
    },
    timelineDot: {
        width: 20,
        height: 20,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    timelineConnector: {
        width: 2,
        height: 44,
        marginTop: -2,
    },
    timelineContent: {
        flex: 1,
        marginLeft: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginBottom: 8,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timelineLevelName: {
        fontSize: 14,
    },
    currentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    timelineReward: {
        fontSize: 12,
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    modalFooter: {
        borderTopWidth: 1,
        paddingTop: 14,
        marginTop: 8,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        textAlign: 'center',
    },
    closeButton: {
        marginTop: 14,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniContainer: {
        paddingVertical: 2,
    },
    miniHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniLevelName: {
        fontSize: 16,
    },
    miniLevelLabel: {
        fontSize: 12,
    },
});
