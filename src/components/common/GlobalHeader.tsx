import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Bell, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '../../store/notificationStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

interface GlobalHeaderProps {
    showBack?: boolean;
    title?: string;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ showBack, title }) => {
    const { isDark, theme, typography } = useTheme();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { unreadCount } = useNotificationStore();

    const logo = isDark
        ? require('../../../assets/images/appicon-dark_theme.webp')
        : require('../../../assets/images/appicon-light_theme.webp');
    const canGoBack = showBack ?? navigation.canGoBack();
    const iconButtonStyle = {
        borderColor: theme.border,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)',
    };

    const handleNotificationPress = () => {
        const parentNav = navigation.getParent();
        if (parentNav) {
            parentNav.navigate('Notifications');
            return;
        }
        navigation.navigate('Notifications');
    };

    return (
        <View style={[styles.outerContainer, { paddingTop: insets.top }]}>
            <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.glass }]}>
                <BlurView
                    intensity={34}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.content}>
                    <View style={styles.side}>
                        {canGoBack && (
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={[styles.iconButton, iconButtonStyle]}
                            >
                                <ChevronLeft color={theme.text} size={26} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {title ? (
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                            {title}
                        </Text>
                    ) : (
                        <Image source={logo} style={styles.logo} resizeMode="contain" />
                    )}

                    <TouchableOpacity
                        style={styles.side}
                        onPress={handleNotificationPress}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconButton, iconButtonStyle]}>
                            <Bell color={theme.text} size={23} />
                            {unreadCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.spiceRed }]} />
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        zIndex: 100,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    container: {
        height: 64,
        borderBottomWidth: 1,
        overflow: 'hidden',
        shadowColor: '#0A6C40',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    side: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        height: 34,
        width: 124,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
    },
    iconButton: {
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 7,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: colors.warmWhite,
    },
});
