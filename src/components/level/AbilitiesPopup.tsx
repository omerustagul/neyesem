import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { Lock, ShieldCheck, Sparkles, Star } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { LEVEL_DATA, PERK_ICONS } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

interface AbilitiesPopupProps {
    visible: boolean;
    onClose: () => void;
    level: number;
}

export const AbilitiesPopup: React.FC<AbilitiesPopupProps> = ({ visible, onClose, level }) => {
    const { theme, isDark, typography } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['85%'], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                onPress={onClose}
                opacity={0.5}
            />
        ),
        [onClose]
    );

    const renderBackground = useCallback(
        () => (
            <View style={StyleSheet.absoluteFill}>
                <View style={[StyleSheet.absoluteFill, { borderRadius: 38, overflow: 'hidden' }]}>
                    <BlurView
                        intensity={isDark ? 50 : 80}
                        tint={isDark ? 'dark' : 'light'}
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                            }
                        ]}
                    />
                </View>
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            borderRadius: 38,
                            borderWidth: 1.5,
                            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                        }
                    ]}
                />
            </View>
        ),
        [isDark]
    );

    // Group perks into Unlocked and Upcoming
    const { unlocked, upcoming } = useMemo(() => {
        const unlockedPerks: { perk: string; level: number }[] = [];
        const upcomingPerks: { perk: string; level: number }[] = [];

        LEVEL_DATA.forEach(data => {
            if (data.level <= level) {
                data.perks.forEach(p => unlockedPerks.push({ perk: p, level: data.level }));
            } else {
                data.perks.forEach(p => upcomingPerks.push({ perk: p, level: data.level }));
            }
        });

        return { unlocked: unlockedPerks, upcoming: upcomingPerks };
    }, [level]);

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
                handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
            >
                <BottomSheetScrollView contentContainerStyle={styles.content}>
                    <MotiView
                        from={{ opacity: 0, scale: 0.9, translateY: -20 }}
                        animate={{ opacity: 1, scale: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 600 }}
                        style={styles.header}
                    >
                        <View style={[styles.iconAura, { backgroundColor: `${colors.saffron}15` }]}>
                            <Sparkles size={32} color={colors.saffron} />
                        </View>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>YETENEKLER & AYRICALIKLAR</Text>
                        <Text style={[styles.subtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Seviye atladıkça yeni mutfak güçleri kazanırsın
                        </Text>
                    </MotiView>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <ShieldCheck size={18} color={colors.mintFresh} />
                            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.display }]}>AÇILANLAR</Text>
                            <View style={[styles.badgeContainer, { backgroundColor: `${colors.mintFresh}15` }]}>
                                <Text style={[styles.badgeText, { color: colors.mintFresh }]}>{unlocked.length}</Text>
                            </View>
                        </View>
                        <View style={styles.grid}>
                            {unlocked.map((item, i) => {
                                const Icon = PERK_ICONS[item.perk] || Star;
                                return (
                                    <MotiView
                                        key={`unlocked-${i}`}
                                        from={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'timing', delay: i * 50 }}
                                        style={[styles.itemCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                    >
                                        <View style={[styles.itemIconBox, { backgroundColor: `${colors.saffron}10` }]}>
                                            <Icon size={18} color={colors.saffron} />
                                        </View>
                                        <View style={styles.itemTextContainer}>
                                            <Text style={[styles.itemName, { color: theme.text, fontFamily: typography.bodyMedium }]} numberOfLines={2}>{item.perk}</Text>
                                            <Text style={[styles.itemLevel, { color: theme.secondaryText, fontFamily: typography.mono }]}>Lv.{item.level}</Text>
                                        </View>
                                    </MotiView>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Lock size={18} color={theme.secondaryText} />
                            <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: typography.display }]}>YAKLAŞANLAR</Text>
                        </View>
                        <View style={styles.grid}>
                            {upcoming.map((item, i) => {
                                const Icon = PERK_ICONS[item.perk] || Star;
                                return (
                                    <MotiView
                                        key={`upcoming-${i}`}
                                        from={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'timing', delay: 300 + i * 50 }}
                                        style={[styles.itemCard, styles.lockedItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                                    >
                                        <View style={styles.itemIconBox}>
                                            <Lock size={16} color={theme.secondaryText} opacity={0.5} />
                                        </View>
                                        <View style={styles.itemTextContainer}>
                                            <Text style={[styles.itemName, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]} numberOfLines={2}>{item.perk}</Text>
                                            <Text style={[styles.itemLevel, { color: colors.saffron, fontFamily: typography.mono }]}>Lv.{item.level}</Text>
                                        </View>
                                    </MotiView>
                                );
                            })}
                        </View>
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>
        </Portal>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 24,
        paddingBottom: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconAura: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        letterSpacing: 2,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 6,
        textAlign: 'center',
        opacity: 0.8,
    },
    section: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 14,
        letterSpacing: 1,
    },
    badgeContainer: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    itemCard: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 24,
        borderWidth: 1,
        gap: 12,
    },
    lockedItem: {
        opacity: 0.7,
    },
    itemIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTextContainer: {
        flex: 1,
    },
    itemName: {
        fontSize: 11,
        lineHeight: 14,
    },
    itemLevel: {
        fontSize: 9,
        marginTop: 2,
        opacity: 0.8,
    },
});
