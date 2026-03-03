import { BlurView } from 'expo-blur';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

export const AppNotification: React.FC = () => {
    const { state, hideNotification, setNotificationHeight } = useNotification();
    const { theme, isDark, typography } = useTheme();
    const insets = useSafeAreaInsets();

    const getIcon = () => {
        switch (state.type) {
            case 'success': return <CheckCircle2 size={20} color={colors.mintFresh} />;
            case 'error': return <AlertCircle size={20} color={colors.spiceRed} />;
            default: return <Info size={20} color={colors.saffron} />;
        }
    };

    const getBorderColor = () => {
        switch (state.type) {
            case 'success': return colors.mintFresh;
            case 'error': return colors.spiceRed;
            default: return colors.saffron;
        }
    };

    const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 70; // Approximation of your GlobalHeader
    const topOffset = insets.top + (Platform.OS === 'ios' ? 52 : 52); // Push below header

    return (
        <View style={[styles.outerContainer, { top: topOffset }]} pointerEvents="box-none">
            <AnimatePresence>
                {state.visible && (
                    <MotiView
                        from={{ translateY: -100, opacity: 0, scale: 0.9 }}
                        animate={{ translateY: 0, opacity: 1, scale: 1 }}
                        exit={{ translateY: -100, opacity: 0, scale: 0.9 }}
                        onDidAnimate={(prop, finished) => {
                            if (prop === 'translateY' && finished) {
                                // If finished animating and visible, set height
                                if (state.visible) setNotificationHeight(80);
                            }
                        }}
                        transition={{ type: 'spring', damping: 15, stiffness: 120 }}
                        style={styles.notificationWrapper}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={hideNotification}
                            style={[
                                styles.container,
                                {
                                    backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
                                    borderColor: getBorderColor() + '40',
                                }
                            ]}
                        >
                            <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

                            <View style={styles.content}>
                                <View style={styles.iconContainer}>
                                    {getIcon()}
                                </View>

                                <View style={styles.textContainer}>
                                    {state.title && (
                                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.bodyMedium }]}>
                                            {state.title}
                                        </Text>
                                    )}
                                    <Text
                                        style={[styles.message, { color: theme.secondaryText, fontFamily: typography.body }]}
                                        numberOfLines={2}
                                    >
                                        {state.message}
                                    </Text>
                                </View>

                                <TouchableOpacity onPress={hideNotification} style={styles.closeBtn}>
                                    <X size={16} color={theme.secondaryText} />
                                </TouchableOpacity>
                            </View>

                            {/* Accent Line */}
                            <View style={[styles.accentLine, { backgroundColor: getBorderColor() }]} />
                        </TouchableOpacity>
                    </MotiView>
                )}
            </AnimatePresence>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    notificationWrapper: {
        width: '100%',
    },
    container: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        minHeight: 64,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingLeft: 16,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    title: {
        fontSize: 14,
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        lineHeight: 18,
    },
    closeBtn: {
        padding: 4,
    },
    accentLine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    }
});
