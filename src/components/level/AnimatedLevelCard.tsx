import {
    Award,
    ShieldCheck,
    Star,
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
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassCard } from '../glass/GlassCard';
import { AbilitiesPopup } from './AbilitiesPopup';
import { BadgesPopup } from './BadgesPopup';
import { LeaderboardPopup } from './LeaderboardPopup';
import { XPBar } from './XPBar';

const LEVEL_DATA = [
    { level: 1, name: 'Düz Yiyici', xpRequired: 0, perks: ['Keşfet Erişimi', 'Profil Oluşturma'], tier: 'Çırak' },
    { level: 2, name: 'Kaşıkçı', xpRequired: 150, perks: ['Tariflere Yorum Yapma', 'Beğeni Gönderme'], tier: 'Çırak' },
    { level: 3, name: 'Ev Aşçısı', xpRequired: 400, perks: ['Kendi Listelerini Oluştur', 'Favoriler'], tier: 'Çırak' },
    { level: 4, name: 'Usta Çırak', xpRequired: 800, perks: ['Görüntülü Tarif Paylaşma', 'Yorumlarda Görsel'], tier: 'Çırak' },
    { level: 5, name: 'Sous Chef', xpRequired: 1500, perks: ['Hikaye Paylaşma', 'Profil Rozeti'], tier: 'Usta' },
    { level: 6, name: 'Şef', xpRequired: 3000, perks: ['Özel Şef Rozeti', 'Mesajlaşma'], tier: 'Usta' },
    { level: 7, name: 'Baş Şef', xpRequired: 5000, perks: ['Çırak Eğitim Yetkisi', 'Öncelikli Keşfet'], tier: 'Usta' },
    { level: 8, name: 'Gastronom', xpRequired: 8000, perks: ['Özel Profil Temaları', 'Gelişmiş Analitik'], tier: 'Usta' },
    { level: 9, name: 'Gurme', xpRequired: 12000, perks: ['Usta Onaylı Rozet', 'Beta Özellikler'], tier: 'Usta' },
    { level: 10, name: 'Altın Çatal', xpRequired: 20000, perks: ['Neyesem Elçilik Statüsü', 'Altın Kullanıcı Adı'], tier: 'Efsane' },
];

const PERK_ICONS: Record<string, React.ComponentType<any>> = {
    'Keşfet Erişimi': Star,
    'Profil Oluşturma': Star,
    'Tariflere Yorum Yapma': Star,
    'Beğeni Gönderme': Star,
    'Kendi Listelerini Oluştur': Star,
    'Favoriler': Star,
    'Görüntülü Tarif Paylaşma': Star,
    'Yorumlarda Görsel': Star,
    'Hikaye Paylaşma': Star,
    'Profil Rozeti': ShieldCheck,
    'Özel Şef Rozeti': Award,
    'Mesajlaşma': Star,
    'Çırak Eğitim Yetkisi': Star,
    'Öncelikli Keşfet': Zap,
    'Özel Profil Temaları': Star,
    'Gelişmiş Analitik': Star,
    'Usta Onaylı Rozet': ShieldCheck,
    'Beta Özellikler': Star,
    'Neyesem Elçilik Statüsü': Trophy,
    'Altın Kullanıcı Adı': Star,
};

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
}) => {
    const { theme, typography } = useTheme();
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showAbilities, setShowAbilities] = useState(false);
    const [showBadges, setShowBadges] = useState(false);

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
                perks={LEVEL_DATA.find(l => l.level === level)?.perks || []}
                perkIcons={PERK_ICONS}
            />
            <BadgesPopup visible={showBadges} onClose={() => setShowBadges(false)} badges={badges} />
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
