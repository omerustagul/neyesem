import { Check, Monitor, Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/glass/GlassCard';
import { ThemeMode, useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

export const AppearanceScreen = ({ navigation }: any) => {
    const { theme, typography, themeMode, setThemeMode } = useTheme();
    const insets = useSafeAreaInsets();
    const headerHeight = 52 + insets.top;

    const ThemeOption = ({ mode, label, icon: Icon }: { mode: ThemeMode, label: string, icon: any }) => {
        const isActive = themeMode === mode;
        return (
            <TouchableOpacity
                onPress={() => setThemeMode(mode)}
                style={styles.optionWrapper}
                activeOpacity={0.7}
            >
                <GlassCard style={[
                    styles.optionCard,
                    isActive && { borderColor: colors.saffron, borderWidth: 2 }
                ]}>
                    <View style={styles.optionContent}>
                        <View style={styles.optionLeft}>
                            <Icon color={isActive ? colors.saffron : theme.text} size={24} />
                            <Text style={[
                                styles.optionLabel,
                                { color: theme.text, fontFamily: isActive ? typography.bodyMedium : typography.body }
                            ]}>
                                {label}
                            </Text>
                        </View>
                        {isActive && <Check color={colors.saffron} size={20} />}
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.content, { paddingTop: headerHeight + 20 }]}>
                <Text style={[styles.sectionTitle, { color: colors.saffron, fontFamily: typography.accent }]}>
                    TEMA SEÇİMİ
                </Text>

                <ThemeOption mode="light" label="Açık" icon={Sun} />
                <ThemeOption mode="dark" label="Koyu" icon={Moon} />
                <ThemeOption mode="system" label="Sistem" icon={Monitor} />

                <View style={{ height: 20 }} />

                <GlassCard style={styles.infoCard}>
                    <Text style={[styles.infoText, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        Sistem seçeneğini belirlerseniz, uygulama görünümü cihazınızın sistem ayarlarına göre otomatik olarak değişecektir.
                    </Text>
                </GlassCard>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 12,
        letterSpacing: 1.5,
        marginBottom: 20,
        marginLeft: 5,
    },
    optionWrapper: {
        width: '100%',
        marginBottom: 12,
    },
    optionCard: {},
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    optionLabel: {
        fontSize: 16,
    },
    infoCard: {},
    infoText: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
    },
});
