import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Check, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useBadgeInfoStore } from '../../store/badgeInfoStore';
import { useTheme } from '../../theme/ThemeProvider';
import { LevelBadge, getLevelTier } from '../level/LevelBadge';
import { VerificationBadge } from './VerificationBadge';

export const BadgeInfoPopup = () => {
    const { theme, typography, isDark } = useTheme();
    const { selectedBadge, hideBadgeInfo } = useBadgeInfoStore();
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Watch for opens
    useEffect(() => {
        if (selectedBadge) {
            // Small delay to ensure the bottom sheet has initialized its state
            const timer = setTimeout(() => {
                bottomSheetRef.current?.snapToIndex(0);
            }, 50);
            return () => clearTimeout(timer);
        } else {
            bottomSheetRef.current?.close();
        }
    }, [selectedBadge]);

    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            hideBadgeInfo();
        }
    }, [hideBadgeInfo]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.4}
                pressBehavior="close"
            />
        ),
        []
    );

    const isVerification = selectedBadge?.type === 'verification';
    const level = selectedBadge?.level || 1;
    let badgeHero = null;
    let title = '';
    let description = '';
    let perks: string[] = [];
    let highlightColor = '#3b82f6';

    if (selectedBadge) {
        if (isVerification) {
            badgeHero = (
                <View style={[styles.heroBadgeBox, { shadowColor: '#3b82f6' }]}>
                    <VerificationBadge size={72} disabled />
                </View>
            );
            title = 'Doğrulanmış Rozet';
            description = 'Topluluğun güvenilir, otantik ve onaylı bir üyesi.';
            highlightColor = '#3b82f6';
            perks = [
                'Profilin ve yorumların daha fazla dikkat çeker.',
                'İçeriklerin keşfet ekranında önceliklendirilir.',
                'Hesabın taklitlere karşı ekstra koruma altındadır.'
            ];
        } else {
            const tier = getLevelTier(level);
            highlightColor = tier.glow === 'transparent' ? tier.border : tier.glow;
            badgeHero = (
                <View style={[styles.heroBadgeBox, { shadowColor: highlightColor, elevation: 8 }]}>
                    <LevelBadge level={level} size={72} disabled />
                </View>
            );
            title = `Seviye ${level} Rozeti`;
            if (level >= 10) {
                description = 'Altın Çatal: Tariflerin efendisi, topluluğun efsanevi üyesi.';
                perks = ['Altın kullanıcı adı görünümü.', 'Gönderilerde maksimum erişim.', 'Premium rozet kalitesi.'];
            } else if (level >= 7) {
                description = 'Usta Şef: Mutfakta harikalar yaratan deneyimli aşçı.';
                perks = ['Yorumlarda öncelikli sıralama.', 'Profilinde prestijli görünüm.'];
            } else if (level >= 5) {
                description = 'Ateşli Aşçı: Mutfağın sıcaklığını hisseden yetenekli üye.';
                perks = ['Toplulukta bilinirlik artışı.'];
            } else if (level >= 3) {
                description = 'Deneyimli Yamak: Temel yeteneklerini kanıtlamış yeni şef adayı.';
                perks = ['Temel rozet görünürlüğü.'];
            } else {
                description = 'Mutfak Çırağı: Yemek yapmayı yeni keşfeden istekli acemi.';
                perks = ['Topluluğa hoşgeldin!', 'Tarif paylaşarak seviyeni yükselt.'];
            }
        }
    }

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={['50%', '55%']}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            onChange={handleSheetChanges}
            backgroundStyle={{
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
            }}
            handleIndicatorStyle={{ backgroundColor: theme.border, width: 40 }}
        >
            <View style={styles.container}>
                {/* Header Controls */}
                <View style={styles.header}>
                    <View style={{ width: 32 }} />
                    <Text style={[styles.headerTitle, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                        Rozet Bilgisi
                    </Text>
                    <TouchableOpacity onPress={hideBadgeInfo} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                        <X size={18} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {badgeHero}

                    <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                        {title}
                    </Text>

                    <Text style={[styles.description, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        {description}
                    </Text>

                    {/* Perks array */}
                    <View style={[styles.perksCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                        {perks.map((perk, i) => (
                            <View key={i} style={styles.perkRow}>
                                <View style={[styles.perkIconBox, { backgroundColor: `${highlightColor}20` }]}>
                                    <Check size={12} color={highlightColor} strokeWidth={3} />
                                </View>
                                <Text style={[styles.perkText, { color: theme.text, fontFamily: typography.body }]}>
                                    {perk}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 13,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        paddingTop: 10,
    },
    heroBadgeBox: {
        marginBottom: 20,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    title: {
        fontSize: 24,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 28,
        paddingHorizontal: 16,
        lineHeight: 20,
    },
    perksCard: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        gap: 12,
    },
    perkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    perkIconBox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    perkText: {
        fontSize: 13,
        flex: 1,
    },
});
