import { getFocusedRouteNameFromRoute, useNavigation, useNavigationState } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Bell, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

// Screens that have their own custom header — GlobalHeader hides itself
const HIDDEN_ON_SCREENS = ['Settings', 'Create', 'EditProfile', 'CreatePlaceholder', 'Reels', 'FoodDetail', 'PublicProfile', 'Archive', 'EditPost'];

const ROUTE_TITLES: Record<string, string> = {
    'Notifications': 'Bildirimler',
    'Appearance': 'Görünüm',
    'EditProfile': 'Profili Düzenle',
    'Explore': 'Keşfet',
    'Lists': 'Listelerim',
    'Profile': 'Profil',
};

// Helper to find the active route name in nested navigators
const getActiveRouteName = (route: any): string => {
    const focusedRouteName = getFocusedRouteNameFromRoute(route);
    return focusedRouteName || route.name;
};

interface GlobalHeaderProps {
    showBack?: boolean;
    title?: string;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ showBack, title }) => {
    const { isDark, theme, typography } = useTheme();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { unreadCount } = useNotificationStore();

    // Determine current route name from the root navigator state
    const currentStackRoute = useNavigationState((state) => state?.routes[state.index]?.name);
    const { activeTab } = useNavigationStore();

    // Resolve the actual screen name (either stack screen or pager tab)
    const currentRouteName = currentStackRoute === 'Main' ? activeTab : currentStackRoute;

    // Hide header on screens with custom headers
    if (HIDDEN_ON_SCREENS.includes(currentRouteName)) {
        return null;
    }

    const displayTitle = title || ROUTE_TITLES[currentRouteName];

    const logo = isDark
        ? require('../../../assets/images/appicon-dark_theme.webp')
        : require('../../../assets/images/appicon-light_theme.webp');
    const canGoBack = showBack ?? navigation.canGoBack();
    const iconButtonStyle = {
        borderColor: theme.border,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)',
    };

    const handleNotificationPress = () => {
        navigation.navigate('Notifications');
    };

    return (
        <View style={styles.outerContainer}>
            {/* Single glass container that spans from top of screen to bottom of header */}
            <View style={[
                styles.glassContainer,
                {
                    paddingTop: insets.top,
                    borderColor: theme.border,
                    backgroundColor: theme.glass,
                }
            ]}>
                <BlurView
                    intensity={50}
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
                                <ChevronLeft color={theme.text} size={24} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {displayTitle ? (
                        <Text style={[styles.title, { color: theme.text, fontFamily: typography.display }]}>
                            {displayTitle}
                        </Text>
                    ) : (
                        <Image source={logo} style={styles.logo} resizeMode="contain" />
                    )}

                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={handleNotificationPress}
                        activeOpacity={0.7}
                    >
                        <Bell color={theme.text} size={24} />
                        {unreadCount > 0 && (
                            <View style={[styles.badge, { backgroundColor: colors.spiceRed, borderColor: theme.background }]} />
                        )}
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
    glassContainer: {
        borderBottomWidth: 0.5,
        overflow: 'hidden',
    },
    content: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    side: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    logo: {
        height: 32,
        width: 120,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    iconButton: {
        position: 'relative',
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#080e0b',
    },
});
