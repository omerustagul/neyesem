import BottomSheet from '@gorhom/bottom-sheet';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassButton } from '../glass/GlassButton';
import { GlassSheet } from '../glass/GlassSheet';
import { LevelBadge } from './LevelBadge';

interface LevelUpSheetProps {
    newLevel: number;
    levelName: string;
    isVisible: boolean;
    onClose: () => void;
}

export const LevelUpSheet: React.FC<LevelUpSheetProps> = ({
    newLevel,
    levelName,
    isVisible,
    onClose
}) => {
    const { theme, typography } = useTheme();
    const sheetRef = useRef<BottomSheet>(null);

    useEffect(() => {
        if (isVisible) {
            sheetRef.current?.expand();
        } else {
            sheetRef.current?.close();
        }
    }, [isVisible]);

    return (
        <GlassSheet
            ref={sheetRef}
            onClose={onClose}
            snapPoints={['60%']}
        >
            <View style={styles.container}>
                {isVisible && (
                    <ConfettiCannon
                        count={200}
                        origin={{ x: -10, y: 0 }}
                        fallSpeed={3000}
                        fadeOut={true}
                    />
                )}

                <View style={styles.badgeContainer}>
                    <LevelBadge level={newLevel} size={100} />
                </View>

                <Text style={[styles.title, { color: colors.saffron, fontFamily: typography.display }]}>
                    Seviye Atladın! 🎉
                </Text>

                <Text style={[styles.levelName, { color: theme.text, fontFamily: typography.accent }]}>
                    Yeni Ünvanın: {levelName}
                </Text>

                <View style={styles.rewardsContainer}>
                    <Text style={[styles.rewardTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                        Kazanılan yeni özellikler:
                    </Text>
                    <Text style={[styles.rewardItem, { color: theme.text, fontFamily: typography.body }]}>
                        • Yeni profil rozeti açıldı
                    </Text>
                    <Text style={[styles.rewardItem, { color: theme.text, fontFamily: typography.body }]}>
                        • Özel içerik paylaşma hakkı
                    </Text>
                </View>

                <GlassButton
                    title="Harika, devam et!"
                    onPress={onClose}
                    style={styles.doneButton}
                />
            </View>
        </GlassSheet>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    badgeContainer: {
        marginVertical: 20,
    },
    title: {
        fontSize: 32,
        textAlign: 'center',
        marginBottom: 10,
    },
    levelName: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 30,
    },
    rewardsContainer: {
        width: '100%',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        marginBottom: 30,
    },
    rewardTitle: {
        fontSize: 14,
        marginBottom: 8,
    },
    rewardItem: {
        fontSize: 16,
        marginBottom: 4,
    },
    doneButton: {
        width: '100%',
    },
});
