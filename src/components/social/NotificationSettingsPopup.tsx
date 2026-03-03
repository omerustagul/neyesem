import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Bell, Check, Layout, PlayCircle, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { getNotificationSettings, updateNotificationSettings } from '../../api/notificationService';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

interface NotificationSettingsPopupProps {
    isVisible: boolean;
    onClose: () => void;
    targetUserId: string;
    currentUserId: string;
    targetUsername: string;
    onSettingsChanged?: () => void;
}

export const NotificationSettingsPopup = ({
    isVisible,
    onClose,
    targetUserId,
    currentUserId,
    targetUsername,
    onSettingsChanged
}: NotificationSettingsPopupProps) => {
    const { theme, isDark, typography } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({ posts: false, stories: false });

    const snapPoints = useMemo(() => ['45%'], []);

    useEffect(() => {
        if (isVisible) {
            loadSettings();
            bottomSheetRef.current?.snapToIndex(0);
        } else {
            bottomSheetRef.current?.close();
        }
    }, [isVisible]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const currentSettings = await getNotificationSettings(currentUserId, targetUserId);
            setSettings({
                posts: currentSettings.posts || false,
                stories: currentSettings.stories || false
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateNotificationSettings(currentUserId, targetUserId, settings);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSettingsChanged?.();
            onClose();
        } catch (error) {
            Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    const toggleAll = () => {
        const anyActive = settings.posts || settings.stories;
        setSettings({ posts: !anyActive, stories: !anyActive });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsAtIndex={-1}
                appearsAtIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={onClose}
            backdropComponent={renderBackdrop}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            android_keyboardInputMode="adjustResize"
            backgroundStyle={{ backgroundColor: 'transparent' }}
            handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }}
        >
            <BottomSheetView style={styles.sheetContainer}>
                <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.blurBackground}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <Bell size={20} color={colors.saffron} />
                            <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                                Bildirimler
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={20} color={theme.secondaryText} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: theme.secondaryText, fontFamily: typography.body }]}>
                        @{targetUsername} kullanıcısından hangi bildirimleri almak istersin?
                    </Text>

                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator color={colors.saffron} />
                        </View>
                    ) : (
                        <View style={styles.optionsContainer}>
                            <TouchableOpacity style={styles.optionRow} onPress={toggleAll} activeOpacity={0.7}>
                                <View style={styles.optionInfo}>
                                    <Text style={[styles.optionLabel, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                        Tüm Bildirimler
                                    </Text>
                                    <Text style={[styles.optionDesc, { color: theme.secondaryText }]}>
                                        {settings.posts && settings.stories ? 'Tümünü kapat' : 'Tümünü aç'}
                                    </Text>
                                </View>
                                <View style={[styles.masterToggle, { backgroundColor: (settings.posts || settings.stories) ? colors.saffron : 'rgba(120,120,128,0.2)' }]}>
                                    {(settings.posts || settings.stories) ? <Check size={14} color="#fff" /> : null}
                                </View>
                            </TouchableOpacity>

                            <View style={[styles.divider, { backgroundColor: theme.border }]} />

                            <View style={styles.optionRow}>
                                <View style={styles.optionInfo}>
                                    <View style={styles.labelWithIcon}>
                                        <Layout size={16} color={theme.secondaryText} style={{ marginRight: 8 }} />
                                        <Text style={[styles.optionLabel, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                            Gönderiler
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={settings.posts}
                                    onValueChange={(val) => setSettings(s => ({ ...s, posts: val }))}
                                    trackColor={{ false: 'rgba(120,120,128,0.2)', true: colors.saffron }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <View style={styles.optionRow}>
                                <View style={styles.optionInfo}>
                                    <View style={styles.labelWithIcon}>
                                        <PlayCircle size={16} color={theme.secondaryText} style={{ marginRight: 8 }} />
                                        <Text style={[styles.optionLabel, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                            Hikayeler
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={settings.stories}
                                    onValueChange={(val) => setSettings(s => ({ ...s, stories: val }))}
                                    trackColor={{ false: 'rgba(120,120,128,0.2)', true: colors.saffron }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.saffron }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Ayarları Kaydet</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </BlurView>
            </BottomSheetView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    sheetContainer: {
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    blurBackground: {
        flex: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
        opacity: 0.8,
    },
    loaderContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsContainer: {
        gap: 12,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    optionInfo: {
        flex: 1,
    },
    labelWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionLabel: {
        fontSize: 16,
    },
    optionDesc: {
        fontSize: 12,
        marginTop: 2,
        opacity: 0.6,
    },
    masterToggle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 4,
    },
    saveButton: {
        marginTop: 20,
        height: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.saffron,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
