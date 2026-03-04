import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { CheckCircle2, ChevronRight, Gift, Star, Zap } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Portal } from 'react-native-paper';
import { LEVEL_DATA, useLevelStore } from '../../store/levelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassButton } from '../glass/GlassButton';
import { LevelBadge } from './LevelBadge';

const { width, height } = Dimensions.get('window');

export const LevelUpSheet = () => {
    const { theme, isDark, typography } = useTheme();
    const { pendingLevelUp, clearLevelUp } = useLevelStore();
    const sheetRef = useRef<BottomSheet>(null);
    const [step, setStep] = useState(1);

    const snapPoints = useMemo(() => ['85%'], []);

    useEffect(() => {
        if (pendingLevelUp) {
            sheetRef.current?.expand();
            setStep(1);
        } else {
            sheetRef.current?.close();
        }
    }, [pendingLevelUp]);

    const levelInfo = useMemo(() => {
        if (!pendingLevelUp) return null;
        return LEVEL_DATA.find(d => d.level === pendingLevelUp.level);
    }, [pendingLevelUp]);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            clearLevelUp();
        }
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                onPress={clearLevelUp}
                opacity={0.5}
            />
        ),
        [clearLevelUp]
    );

    const renderBackground = useCallback(() => (
        <View style={StyleSheet.absoluteFill}>
            <BlurView
                intensity={isDark ? 50 : 80}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                        borderRadius: 30,
                        overflow: 'hidden',
                        borderWidth: 1.5,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    }
                ]}
            />
        </View>
    ), [isDark]);

    if (!pendingLevelUp) return null;

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <MotiView
                        key="step1"
                        from={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', damping: 12 }}
                        style={styles.stepContent}
                    >
                        <View style={styles.badgeContainer}>
                            <MotiView
                                from={{ rotate: '-10deg', scale: 0.5, opacity: 0 }}
                                animate={{ rotate: '0deg', scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 10, delay: 300 }}
                            >
                                <LevelBadge level={pendingLevelUp.level} size={160} />
                            </MotiView>
                        </View>

                        <MotiView
                            from={{ opacity: 0, translateY: 20 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ delay: 600 }}
                            style={{ alignItems: 'center' }}
                        >
                            <Text style={[styles.congratsText, { color: colors.saffron, fontFamily: typography.display }]}>
                                Harika!
                            </Text>
                            <Text style={[styles.mainTitle, { color: theme.text, fontFamily: typography.display }]}>
                                Seviye Atladınız
                            </Text>
                            <View style={[styles.nameTag, { backgroundColor: `${colors.saffron}20`, borderColor: `${colors.saffron}30` }]}>
                                <Text style={[styles.levelName, { color: colors.saffron, fontFamily: typography.accent }]}>
                                    {pendingLevelUp.name}
                                </Text>
                            </View>
                        </MotiView>
                    </MotiView>
                );
            case 2:
                return (
                    <MotiView
                        key="step2"
                        from={{ opacity: 0, translateX: 50 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        exit={{ opacity: 0, translateX: -50 }}
                        style={styles.stepContent}
                    >
                        <View style={[styles.stepHeader, { backgroundColor: `${colors.saffron}15`, borderColor: `${colors.saffron}30`, borderWidth: 1 }]}>
                            <Gift color={colors.saffron} size={32} />
                        </View>
                        <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display }]}>
                            Ödüller & Kazanımlar
                        </Text>
                        <View style={styles.listContainer}>
                            {levelInfo?.rewards.map((reward, i) => (
                                <MotiView
                                    key={i}
                                    from={{ opacity: 0, translateY: 15 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    transition={{ delay: i * 100 }}
                                    style={[styles.listItem, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                >
                                    <View style={[styles.listIcon, { backgroundColor: `${colors.mintFresh}15` }]}>
                                        <CheckCircle2 color={colors.mintFresh} size={18} />
                                    </View>
                                    <Text style={[styles.listText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                        {reward}
                                    </Text>
                                </MotiView>
                            ))}
                        </View>
                    </MotiView>
                );
            case 3:
                return (
                    <MotiView
                        key="step3"
                        from={{ opacity: 0, translateX: 50 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        exit={{ opacity: 0, translateX: -50 }}
                        style={styles.stepContent}
                    >
                        <View style={[styles.stepHeader, { backgroundColor: `${colors.mintFresh}15`, borderColor: `${colors.mintFresh}30`, borderWidth: 1 }]}>
                            <Zap color={colors.mintFresh} size={32} />
                        </View>
                        <Text style={[styles.stepTitle, { color: theme.text, fontFamily: typography.display }]}>
                            Yeni Yetenekler
                        </Text>
                        <View style={styles.listContainer}>
                            {levelInfo?.perks.map((perk, i) => (
                                <MotiView
                                    key={i}
                                    from={{ opacity: 0, translateY: 15 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    transition={{ delay: i * 100 }}
                                    style={[styles.listItem, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                >
                                    <View style={[styles.listIcon, { backgroundColor: `${colors.saffron}15` }]}>
                                        <Star color={colors.saffron} size={18} />
                                    </View>
                                    <Text style={[styles.listText, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                        {perk}
                                    </Text>
                                </MotiView>
                            ))}
                        </View>
                    </MotiView>
                );
        }
    };

    return (
        <Portal>
            <BottomSheet
                ref={sheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                onClose={clearLevelUp}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: 'transparent' }}
                backgroundComponent={renderBackground}
                handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', width: 40 }}
            >
                <View style={styles.container}>
                    {pendingLevelUp && step === 1 && (
                        <ConfettiCannon
                            count={200}
                            origin={{ x: width / 2, y: -20 }}
                            fallSpeed={3000}
                            fadeOut={true}
                        />
                    )}

                    <BottomSheetView style={styles.sheetContent}>
                        <AnimatePresence exitBeforeEnter>
                            {renderStepContent()}
                        </AnimatePresence>

                        <View style={styles.footer}>
                            <View style={styles.stepIndicator}>
                                {[1, 2, 3].map((s) => (
                                    <MotiView
                                        key={s}
                                        animate={{
                                            width: s === step ? 20 : 8,
                                            backgroundColor: s === step ? colors.saffron : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
                                        }}
                                        style={styles.dot}
                                    />
                                ))}
                            </View>

                            <GlassButton
                                title={step === 3 ? "Tamamla" : "İleri"}
                                onPress={handleNext}
                                icon={step < 3 ? <ChevronRight color="#fff" size={20} /> : undefined}
                                style={styles.button}
                            />
                        </View>
                    </BottomSheetView>
                </View>
            </BottomSheet>
        </Portal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sheetContent: {
        flex: 1,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        justifyContent: 'space-between',
    },
    stepContent: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 10,
    },
    badgeContainer: {
        marginBottom: 20,
        shadowColor: colors.saffron,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
        elevation: 15,
    },
    congratsText: {
        fontSize: 28,
        letterSpacing: 2,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    mainTitle: {
        fontSize: 36,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 40,
    },
    nameTag: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    levelName: {
        fontSize: 20,
        textAlign: 'center',
        fontWeight: '700',
    },
    stepHeader: {
        width: 84,
        height: 84,
        borderRadius: 42,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    stepTitle: {
        fontSize: 26,
        textAlign: 'center',
        marginBottom: 32,
    },
    listContainer: {
        width: '100%',
        gap: 12,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1.5,
    },
    listIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    listText: {
        fontSize: 16,
        flex: 1,
        lineHeight: 22,
    },
    footer: {
        gap: 24,
        marginTop: 20,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    button: {
        width: '100%',
        height: 60,
    },
});
