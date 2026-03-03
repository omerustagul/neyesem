import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { ShieldCheck, Star } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Portal } from 'react-native-paper';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassCard } from '../glass/GlassCard';

interface AbilitiesPopupProps {
    visible: boolean;
    onClose: () => void;
    level: number;
    perks: string[];
    perkIcons: Record<string, React.ComponentType<any>>;
}

export const AbilitiesPopup: React.FC<AbilitiesPopupProps> = ({ visible, onClose, level, perks, perkIcons }) => {
    const { theme, isDark, typography } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['60%'], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} onPress={onClose} />
        ),
        [onClose]
    );

    if (!visible) return null;

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                onClose={onClose}
                backgroundStyle={{ backgroundColor: theme.background }}
                handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
            >
                <BottomSheetView style={styles.content}>
                    <View style={styles.header}>
                        <ShieldCheck size={32} color={colors.saffron} style={{ marginBottom: 12 }} />
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>YETENEKLERİN</Text>
                        <Text style={[styles.subtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                            Seviye {level} itibariyle kazandığın ayrıcalıklar
                        </Text>
                    </View>

                    <View style={styles.grid}>
                        {perks.map((perk, i) => {
                            const Icon = perkIcons[perk] || Star;
                            return (
                                <GlassCard key={i} style={styles.perkCard} intensity={10}>
                                    <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                        <Icon size={20} color={colors.saffron} />
                                    </View>
                                    <Text style={[styles.perkName, { color: theme.text, fontFamily: typography.bodyMedium }]}>{perk}</Text>
                                </GlassCard>
                            );
                        })}
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </Portal>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
        opacity: 0.7,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    perkCard: {
        width: '48%',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    perkName: {
        fontSize: 12,
        textAlign: 'center',
    },
});
