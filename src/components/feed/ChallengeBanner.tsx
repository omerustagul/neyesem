import { Trophy, Users, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Challenge, UserChallengeProgress, startChallenge } from '../../api/challengeService';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassCard } from '../glass/GlassCard';

interface ChallengeBannerProps {
    challenge: Challenge | null;
    progress: UserChallengeProgress | null;
    userId: string;
}

export const ChallengeBanner: React.FC<ChallengeBannerProps> = ({ challenge, progress, userId }) => {
    const { theme, typography, isDark } = useTheme();

    if (!challenge) return null;

    const isNotStarted = !progress;
    const isInProgress = progress?.status === 'in_progress';
    const isCompleted = progress?.status === 'completed';

    const handleStart = () => {
        startChallenge(userId);
    };

    return (
        <GlassCard style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={[styles.iconWrap, { backgroundColor: isCompleted ? `${colors.oliveMuted}20` : `${colors.saffron}20` }]}>
                        {isCompleted ? <Trophy size={18} color={colors.oliveMuted} /> : <Zap size={18} color={colors.saffron} />}
                    </View>
                    <View>
                        <Text style={[styles.label, { color: theme.secondaryText }]}>Haftalık Lezzet Görevi</Text>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            {challenge.title}
                        </Text>
                    </View>
                </View>
                {isCompleted && (
                    <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>TAMAMLANDI</Text>
                    </View>
                )}
            </View>

            <Text style={[styles.description, { color: theme.secondaryText }]}>
                {challenge.description}
            </Text>

            <View style={styles.footer}>
                <View style={styles.stats}>
                    <View style={styles.statItem}>
                        <Trophy size={14} color={colors.saffron} />
                        <Text style={[styles.statText, { color: theme.text }]}>{challenge.xpReward} XP</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Users size={14} color={theme.secondaryText} />
                        <Text style={[styles.statText, { color: theme.secondaryText }]}>{challenge.participantCount} katılımcı</Text>
                    </View>
                </View>

                {isNotStarted && (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.saffron }]}
                        onPress={handleStart}
                    >
                        <Text style={styles.buttonText}>Göreve Katıl</Text>
                    </TouchableOpacity>
                )}

                {isInProgress && (
                    <View style={[styles.statusBadge, { backgroundColor: `${colors.saffron}10`, borderColor: colors.saffron }]}>
                        <Text style={[styles.statusText, { color: colors.saffron }]}>Devam Ediyor</Text>
                    </View>
                )}
            </View>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    label: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    title: {
        fontSize: 15,
    },
    description: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stats: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        fontWeight: '500',
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    buttonText: {
        color: colors.warmWhite,
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    completedBadge: {
        backgroundColor: `${colors.oliveMuted}20`,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    completedText: {
        color: colors.oliveMuted,
        fontSize: 9,
        fontWeight: '700',
    },
});
