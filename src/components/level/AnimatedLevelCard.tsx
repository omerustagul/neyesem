import { Award, Zap } from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassCard } from '../glass/GlassCard';
import { XPBar } from './XPBar';

interface AnimatedLevelCardProps {
    level: number;
    xp: number;
    xpNext: number;
    levelName: string;
}

export const AnimatedLevelCard: React.FC<AnimatedLevelCardProps> = ({
    level,
    xp,
    xpNext,
    levelName
}) => {
    const { theme, typography } = useTheme();

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 200 }}
            style={styles.container}
        >
            <GlassCard style={styles.card}>
                <View style={styles.header}>
                    <MotiView
                        animate={{ rotate: '360deg' }}
                        transition={{ loop: true, duration: 4000, type: 'timing' }}
                    >
                        <Zap color={colors.saffron} size={20} fill={colors.saffron} />
                    </MotiView>
                    <Text style={[styles.title, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                        SEVİYE {level}
                    </Text>
                    <Award color={colors.saffron} size={20} />
                </View>

                <Text style={[styles.levelName, { color: colors.saffron, fontFamily: typography.display }]}>
                    {levelName}
                </Text>

                <View style={styles.xpSection}>
                    <View style={styles.xpInfo}>
                        <Text style={[styles.xpText, { color: theme.secondaryText, fontFamily: typography.mono }]}>
                            {xp} / {xpNext} XP
                        </Text>
                        <Text style={[styles.percentText, { color: colors.saffron, fontFamily: typography.mono }]}>
                            {Math.round((xp / xpNext) * 100)}%
                        </Text>
                    </View>
                    <XPBar xp={xp} xpNext={xpNext} />
                </View>

                <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 800 }}
                    style={styles.footer}
                >
                    <Text style={[styles.footerText, { color: colors.oliveLight, fontFamily: typography.body }]}>
                        Bir sonraki ödül: <Text style={{ color: colors.saffron }}>Gurme Rozeti</Text>
                    </Text>
                </MotiView>
            </GlassCard>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 20,
        marginVertical: 10,
    },
    card: {
        padding: 20,
        backgroundColor: 'rgba(244, 164, 24, 0.05)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    title: {
        fontSize: 12,
        letterSpacing: 2,
    },
    levelName: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20,
    },
    xpSection: {
        marginBottom: 10,
    },
    xpInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    xpText: {
        fontSize: 12,
    },
    percentText: {
        fontSize: 12,
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
    },
    footerText: {
        fontSize: 11,
    }
});
