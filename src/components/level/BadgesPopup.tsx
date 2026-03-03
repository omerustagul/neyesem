import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Crown, Shield, Sparkles, Star } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useCallback, useMemo, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

interface BadgesPopupProps {
    visible: boolean;
    onClose: () => void;
    badges: string[];
}

const BADGE_DESIGNS: Record<string, { colors: string[], icon: any, label: string }> = {
    'Mutfak Ustası': { colors: ['#FFD700', '#FFA500', '#B8860B'], icon: Shield, label: 'MUTFAK USTASI' },
    'Lezzet Avcısı': { colors: ['#F87171', '#EF4444', '#B91C1C'], icon: Star, label: 'LEZZET AVCISI' },
    'Tat Dedektifi': { colors: ['#60A5FA', '#3B82F6', '#1D4ED8'], icon: Sparkles, label: 'TAT DEDEKTİFİ' },
    'Gurme': { colors: ['#A78BFA', '#8B5CF6', '#6D28D9'], icon: Crown, label: 'KRALİYET GURMESİ' },
};

const NobleBadge = ({ badge, isLocked = false }: { badge: string, isLocked?: boolean }) => {
    const { theme, typography } = useTheme();
    const design = BADGE_DESIGNS[badge] || { colors: ['#94A3B8', '#64748B', '#334155'], icon: Award, label: badge.toUpperCase() };
    const Icon = design.icon;

    return (
        <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 100 }}
            style={styles.badgeWrapper}
        >
            <View style={styles.magnificentContainer}>
                {/* Multi-layered Gradients for Depth */}
                <LinearGradient
                    colors={design.colors as [string, string, ...string[]]}
                    style={styles.outerGlow}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                <View style={styles.innerShield}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Shimmer Effect */}
                    <MotiView
                        from={{ translateX: -100 }}
                        animate={{ translateX: 100 }}
                        transition={{
                            loop: true,
                            duration: 3000,
                            repeatReverse: false,
                        }}
                        style={styles.shimmer}
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />
                    </MotiView>

                    <Icon size={38} color="#fff" />

                    {/* Inner Sparkles for "Magnificence" */}
                    <MotiView
                        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.1, 1] }}
                        transition={{ loop: true, duration: 2000 }}
                        style={styles.sparkleOverlay}
                    >
                        <Sparkles size={16} color="#fff" style={styles.sparkle1} />
                        <Sparkles size={12} color="#fff" style={styles.sparkle2} />
                    </MotiView>
                </View>

                {/* Noble Border */}
                <View style={[styles.nobleBorder, { borderColor: design.colors[0] }]} />
            </View>

            <Text style={[styles.badgeName, { color: theme.text, fontFamily: typography.display }]}>
                {design.label}
            </Text>
            <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: colors.saffron, fontFamily: typography.mono }]}>NIŞAN</Text>
            </View>
        </MotiView>
    );
};

export const BadgesPopup: React.FC<BadgesPopupProps> = ({ visible, onClose, badges }) => {
    const { theme, isDark, typography } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['75%'], []);

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
                <BottomSheetView style={styles.content}>
                    <View style={styles.header}>
                        <MotiView
                            from={{ rotate: '0deg' }}
                            animate={{ rotate: '360deg' }}
                            transition={{ loop: true, duration: 10000, type: 'timing' }}
                        >
                            <Crown size={32} color={colors.saffron} />
                        </MotiView>
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>ASİL NİŞANLARIN</Text>
                        <Text style={[styles.subtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Gurme yolculuğunda kazandığın görkemli başarılar
                        </Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                        <View style={styles.grid}>
                            {badges.map((badge, i) => (
                                <NobleBadge key={i} badge={badge} />
                            ))}
                            {badges.length === 0 && (
                                <View style={styles.emptyState}>
                                    <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Henüz bir nişan kazanılmadı.</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </BottomSheetView>
            </BottomSheet>
        </Portal>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 22,
        letterSpacing: 2,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 13,
        marginTop: 6,
        opacity: 0.7,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    scroll: {
        paddingBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        justifyContent: 'center',
    },
    badgeWrapper: {
        width: '45%',
        alignItems: 'center',
        marginBottom: 20,
    },
    magnificentContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    outerGlow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 50,
        opacity: 0.3,
        transform: [{ scale: 1.2 }],
    },
    innerShield: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        zIndex: 2,
    },
    shimmer: {
        position: 'absolute',
        width: '200%',
        height: '100%',
        transform: [{ rotate: '45deg' }],
    },
    nobleBorder: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderStyle: 'dashed',
        opacity: 0.5,
    },
    sparkleOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    sparkle1: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    sparkle2: {
        position: 'absolute',
        bottom: 15,
        left: 10,
    },
    badgeName: {
        fontSize: 11,
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 6,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 191, 0, 0.1)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 191, 0, 0.3)',
    },
    statusText: {
        fontSize: 8,
        letterSpacing: 1,
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
