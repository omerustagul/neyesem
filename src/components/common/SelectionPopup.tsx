import { AnimatePresence, MotiView } from 'moti';
import React from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

const { width } = Dimensions.get('window');

export interface SelectionOption {
    label: string;
    onPress: () => void;
    icon?: React.ReactNode | ((color: string) => React.ReactNode);
    activeIconColor?: string; // Optional: specific color for the icon when active
    type?: 'default' | 'destructive' | 'cancel';
    half?: boolean;
    active?: boolean; // If true, option is visually highlighted and non-pressable
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

    const cancelOption = options.find(o => o.type === 'cancel');
    const normalOptions = options.filter(o => o.type !== 'cancel' && o.type !== 'destructive');
    const destructiveOptions = options.filter(o => o.type === 'destructive');

    // Colors
    const containerBg = isDark ? '#131314ff' : '#FFFFFF';
    const itemBg = isDark ? 'rgba(35, 35, 35, 0.45)' : 'rgba(0,0,0,0.04)';
    const activeBg = isDark ? '#14854A' : '#14854A';
    const textColor = isDark ? '#F5F5F5' : '#1A1A1A';
    const activeTextColor = isDark ? '#FFFFFF' : '#FFFFFF';
    const secondaryTextColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
    const cancelBg = isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)';
    const cancelTextColor = '#EF4444';

    const renderIcon = (option: SelectionOption, color: string) => {
        if (!option.icon) return null;

        // Use activeIconColor if provided and option is active
        const iconColor = (option.active && option.activeIconColor) ? option.activeIconColor : color;

        if (typeof option.icon === 'function') {
            return option.icon(iconColor);
        }
        if (React.isValidElement(option.icon)) {
            return React.cloneElement(option.icon as React.ReactElement<any>, { color: iconColor });
        }
        return option.icon;
    };

    const renderOptionButton = (option: SelectionOption, index: number) => {
        const isHalf = option.half === true;
        const isActive = option.active === true;
        const currentColor = isActive ? activeTextColor : textColor;

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
                        backgroundColor: isActive ? activeBg : itemBg,
                        width: isHalf ? '48.5%' : '100%',
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

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <AnimatePresence>
                    {visible && (
                        <MotiView
                            from={{ translateY: 300, opacity: 0 }}
                            animate={{ translateY: 0, opacity: 1 }}
                            exit={{ translateY: 300, opacity: 0 }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 180,
                                mass: 0.8,
                            }}
                        >
                            {/* Main container — anchored to bottom & sides */}
                            <View style={[
                                styles.mainCard,
                                { backgroundColor: containerBg, paddingHorizontal: 0 },
                                styles.shadow,
                            ]}>
                                <View style={{ flexDirection: 'row', width: width * 2 }}>
                                    <MotiView
                                        animate={{ translateX: showCustomContent ? -width : 0 }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                        style={{ width: width, paddingHorizontal: 32, gap: 10 }}
                                    >
                                        {/* Title */}
                                        {title && (
                                            <Text style={[
                                                styles.title,
                                                {
                                                    color: secondaryTextColor,
                                                    fontFamily: typography.bodyMedium,
                                                }
                                            ]}>
                                                {title.toLocaleUpperCase('tr-TR')}
                                            </Text>
                                        )}

                                        {/* Options Grid */}
                                        <View style={styles.optionsGrid}>
                                            {normalOptions.map((option, index) =>
                                                renderOptionButton(option, index)
                                            )}
                                        </View>

                                        {/* Destructive options */}
                                        {destructiveOptions.map((option, index) => (
                                            <TouchableOpacity
                                                key={`destructive-${index}`}
                                                activeOpacity={0.6}
                                                onPress={() => {
                                                    option.onPress();
                                                    onClose();
                                                }}
                                                style={[
                                                    styles.optionButton,
                                                    {
                                                        backgroundColor: itemBg,
                                                        width: '100%',
                                                    }
                                                ]}
                                            >
                                                {option.icon && (
                                                    <View style={styles.optionIcon}>
                                                        {renderIcon(option, textColor)}
                                                    </View>
                                                )}
                                                <Text style={[
                                                    styles.optionLabel,
                                                    {
                                                        color: textColor,
                                                        fontFamily: typography.body,
                                                    }
                                                ]}>
                                                    {option.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}

                                        {/* Cancel button */}
                                        {cancelOption && (
                                            <TouchableOpacity
                                                activeOpacity={0.6}
                                                onPress={onClose}
                                                style={[
                                                    styles.cancelButton,
                                                    { backgroundColor: cancelBg }
                                                ]}
                                            >
                                                {cancelOption.icon ? (
                                                    <View style={styles.optionIcon}>
                                                        {renderIcon(cancelOption, cancelTextColor)}
                                                    </View>
                                                ) : (
                                                    <Text style={[styles.cancelX, { fontFamily: typography.bodyMedium }]}>✕</Text>
                                                )}
                                                <Text style={[
                                                    styles.optionLabel,
                                                    {
                                                        color: cancelTextColor,
                                                        fontFamily: typography.bodyMedium,
                                                    }
                                                ]}>
                                                    {cancelOption.label}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </MotiView>

                                    <MotiView
                                        animate={{ translateX: showCustomContent ? -width : 0 }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                        style={{ width: width, paddingHorizontal: 32 }}
                                    >
                                        {customContent}
                                    </MotiView>
                                </View>
                            </View>
                        </MotiView>
                    )}
                </AnimatePresence>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    mainCard: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingTop: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        overflow: 'hidden',
    },
    shadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -12 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    title: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 52,
        borderRadius: 18,
        paddingHorizontal: 24,
        gap: 8,
    },
    optionIcon: {
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabel: {
        fontSize: 15,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 52,
        borderRadius: 18,
        paddingHorizontal: 24,
        gap: 8,
    },
    cancelX: {
        fontSize: 16,
        color: '#EF4444',
    },
});
