import { BlurView } from 'expo-blur';
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
import { colors } from '../../theme/colors';

const { height } = Dimensions.get('window');

export interface SelectionOption {
    label: string;
    onPress: () => void;
    type?: 'default' | 'destructive' | 'cancel';
}

interface SelectionPopupProps {
    visible: boolean;
    title?: string;
    options: SelectionOption[];
    onClose: () => void;
}

export const SelectionPopup: React.FC<SelectionPopupProps> = ({
    visible,
    title,
    options,
    onClose
}) => {
    const { theme, isDark, typography } = useTheme();

    const cancelOption = options.find(o => o.type === 'cancel');
    const otherOptions = options.filter(o => o.type !== 'cancel');

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
                            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                            style={styles.container}
                        >
                            {/* Main Options Group */}
                            <View style={[
                                styles.group,
                                { backgroundColor: isDark ? 'rgba(40,40,40,0.85)' : 'rgba(255,255,255,0.85)' },
                                styles.shadow
                            ]}>
                                <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

                                {title && (
                                    <View style={[styles.titleContainer, { borderBottomColor: theme.border }]}>
                                        <Text style={[styles.title, { color: theme.secondaryText, fontFamily: typography.bodyMedium }]}>
                                            {title}
                                        </Text>
                                    </View>
                                )}

                                {otherOptions.map((option, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.option,
                                            index !== otherOptions.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 0.5 }
                                        ]}
                                        onPress={() => {
                                            option.onPress();
                                            onClose();
                                        }}
                                    >
                                        <Text style={[
                                            styles.optionLabel,
                                            {
                                                color: option.type === 'destructive' ? colors.saffron : theme.text,
                                                fontFamily: typography.bodyMedium
                                            }
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Cancel Option */}
                            {cancelOption && (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={[
                                        styles.group,
                                        styles.cancelGroup,
                                        { backgroundColor: isDark ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)' },
                                        styles.shadow
                                    ]}
                                    onPress={onClose}
                                >
                                    <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                                    <Text style={[styles.optionLabel, styles.cancelLabel, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                        {cancelOption.label}
                                    </Text>
                                </TouchableOpacity>
                            )}
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
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        paddingHorizontal: 10,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    container: {
        width: '100%',
    },
    group: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 8,
    },
    shadow: {
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    titleContainer: {
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 0.5,
    },
    title: {
        fontSize: 13,
        textAlign: 'center',
    },
    option: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLabel: {
        fontSize: 17,
    },
    cancelGroup: {
        marginTop: 4,
    },
    cancelLabel: {
        fontWeight: '600',
    },
});
