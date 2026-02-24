import { Share2, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PalateProfile, getPalatePersona } from '../../api/palateService';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassCard } from '../glass/GlassCard';

interface PalateCardProps {
    profile: PalateProfile | null;
}

export const PalateCard: React.FC<PalateCardProps> = ({ profile }) => {
    const { theme, typography, isDark } = useTheme();

    if (!profile) return null;

    const persona = getPalatePersona(profile.palatePersona);
    const hasPersona = profile.signalCount >= 5;

    // Get top cuisines and flavor notes
    const cuisineEntires = Object.entries(profile.cuisines)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2);

    const flavorEntries = Object.entries(profile.flavorProfile)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2);

    return (
        <GlassCard style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleInfo}>
                    <View style={[styles.iconWrap, { backgroundColor: `${colors.saffron}20` }]}>
                        <Zap size={18} color={colors.saffron} />
                    </View>
                    <View>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                            AI Damak Profili
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                            {profile.signalCount} etkileşim analiz edildi
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.shareButton, { borderColor: theme.border }]}>
                    <Share2 size={16} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.personaBox}>
                <Text style={styles.personaIcon}>
                    {hasPersona ? persona.name.split(' ')[0] : '🥚'}
                </Text>
                <View style={styles.personaText}>
                    <Text style={[styles.personaName, { color: theme.text, fontFamily: typography.display }]}>
                        {hasPersona ? persona.name.split(' ').slice(1).join(' ') : 'Lezzet Yumurtası'}
                    </Text>
                    <Text style={[styles.personaDesc, { color: theme.secondaryText }]}>
                        {hasPersona ? persona.description : 'Analiz edilmek için biraz daha gönderi beğenmelisin.'}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
                <View style={styles.statColumn}>
                    <Text style={[styles.statTitle, { color: theme.secondaryText }]}>Mutfaklar</Text>
                    {cuisineEntires.map(([name, score]) => (
                        <View key={name} style={styles.barItem}>
                            <View style={styles.barHeader}>
                                <Text style={[styles.barName, { color: theme.text }]}>{capitalize(name)}</Text>
                                <Text style={[styles.barValue, { color: colors.saffron }]}>%{Math.round(score)}</Text>
                            </View>
                            <View style={[styles.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                                <View style={[styles.barFill, { width: `${score}%`, backgroundColor: colors.saffron }]} />
                            </View>
                        </View>
                    ))}
                </View>

                <View style={[styles.statColumn, styles.rightColumn]}>
                    <Text style={[styles.statTitle, { color: theme.secondaryText }]}>Lezzet Notları</Text>
                    {flavorEntries.map(([name, score]) => (
                        <View key={name} style={styles.barItem}>
                            <View style={styles.barHeader}>
                                <Text style={[styles.barName, { color: theme.text }]}>{capitalize(name)}</Text>
                                <Text style={[styles.barValue, { color: colors.oliveMuted }]}>%{Math.round(score)}</Text>
                            </View>
                            <View style={[styles.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                                <View style={[styles.barFill, { width: `${score}%`, backgroundColor: colors.oliveMuted }]} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </GlassCard>
    );
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
    container: {
        padding: 16,
        marginVertical: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    titleInfo: {
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
    title: {
        fontSize: 16,
    },
    subtitle: {
        fontSize: 11,
    },
    shareButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    personaBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,178,0,0.05)',
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
    },
    personaIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    personaText: {
        flex: 1,
    },
    personaName: {
        fontSize: 18,
        letterSpacing: -0.5,
    },
    personaDesc: {
        fontSize: 12,
        lineHeight: 16,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
    },
    statColumn: {
        flex: 1,
    },
    rightColumn: {
        marginLeft: 16,
    },
    statTitle: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    barItem: {
        marginBottom: 8,
    },
    barHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    barName: {
        fontSize: 11,
    },
    barValue: {
        fontSize: 11,
        fontWeight: '600',
    },
    barBg: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 2,
    },
});
