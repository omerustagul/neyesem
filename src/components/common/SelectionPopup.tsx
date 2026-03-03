import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import React, { useCallback, useMemo, useRef } from 'react';
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Portal } from 'react-native-paper';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

export interface SelectionOption {
    label: string;
    onPress: () => void;
    icon?: React.ReactNode | ((color: string) => React.ReactNode);
    activeIconColor?: string;
    type?: 'default' | 'destructive' | 'cancel';
    half?: boolean;
    active?: boolean;
}

interface SelectionPopupProps {
    visible: boolean;
    title?: string;
    options: SelectionOption[];
    onClose: () => void;
    customContent?: React.ReactNode;
    showCustomContent?: boolean;
}

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
    visible,
    title,
    options,
    onClose,
    customContent,
    showCustomContent = false
}) => {
    const { theme, isDark, typography } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);

    const snapPoints = useMemo(() => {
        const optionCount = options.length;
        const autoHeight = 80 + (optionCount * 62) + (title ? 60 : 0) + (Platform.OS === 'ios' ? 60 : 40);
        // User liked the height of Leaderboard (85%), so we make it more immersive
        return [Math.min(Math.max(autoHeight, 400), 750)];
    }, [options, title]);

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

    const normalOptions = options.filter(o => o.type !== 'cancel' && o.type !== 'destructive');
    const destructiveOptions = options.filter(o => o.type === 'destructive');
    const cancelOption = options.find(o => o.type === 'cancel');

    const renderIcon = (option: SelectionOption, color: string) => {
        if (!option.icon) return null;
        const iconColor = (option.active && option.activeIconColor) ? option.activeIconColor : color;
        if (typeof option.icon === 'function') return option.icon(iconColor);
        if (React.isValidElement(option.icon)) return React.cloneElement(option.icon as React.ReactElement<any>, { color: iconColor });
        return option.icon;
    };

    const renderOptionButton = (option: SelectionOption, index: number) => {
        const isActive = option.active === true;
        const isDestructive = option.type === 'destructive';
        const currentColor = isActive ? colors.warmWhite : (isDestructive ? colors.spiceRed : theme.text);

        return (
            <TouchableOpacity
                key={`option-${index}`}
                activeOpacity={isActive ? 1 : 0.6}
                disabled={isActive}
                onPress={() => {
                    option.onPress();
                    onClose();
                }}
                style={[
                    styles.optionButton,
                    {
                        backgroundColor: isActive ? colors.saffron : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'),
                        width: option.half ? '48.5%' : '100%',
                        borderColor: isActive ? colors.saffron : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                        borderWidth: 1,
                    }
                ]}
            >
                {option.icon && (
                    <View style={styles.optionIcon}>
                        {renderIcon(option, currentColor)}
                    </View>
                )}
                <Text style={[
                    styles.optionLabel,
                    {
                        color: currentColor,
                        fontFamily: isActive ? typography.bodyMedium : typography.body,
                    }
                ]}>
                    {option.label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (!visible) return null;

    return (
        <Portal>
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
                onClose={onClose}
                backgroundStyle={{ backgroundColor: 'transparent' }}
                backgroundComponent={renderBackground}
                handleIndicatorStyle={{ backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', width: 40 }}
            >
                <BottomSheetView style={styles.content}>
                    {title && (
                        <Text style={[styles.title, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                            {title.toLocaleUpperCase('tr-TR')}
                        </Text>
                    )}

                    <View style={styles.optionsGrid}>
                        {normalOptions.map((option, index) => renderOptionButton(option, index))}
                    </View>

                    {destructiveOptions.map((option, index) => renderOptionButton(option, index + 100))}

                    {cancelOption && (
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.cancelButton, { backgroundColor: isDark ? 'rgba(214,70,70,0.1)' : 'rgba(214,70,70,0.05)' }]}
                        >
                            <Text style={[styles.cancelLabel, { color: colors.spiceRed, fontFamily: typography.bodyMedium }]}>
                                {cancelOption.label}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {showCustomContent && customContent}
                </BottomSheetView>
            </BottomSheet>
        </Portal>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingTop: 8,
    },
    title: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 2,
        opacity: 0.8,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 10,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 56,
        borderRadius: 20,
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 4,
    },
    optionIcon: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabel: {
        fontSize: 16,
    },
    cancelButton: {
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    cancelLabel: {
        fontSize: 16,
    },
});
