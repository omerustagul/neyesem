import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Bookmark, Compass, Home, PlusCircle, User } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    SharedValue,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { colors } from '../theme/colors';

const SPRING_CONFIG = { damping: 20, stiffness: 250, mass: 0.8 };

interface CustomTabBarProps extends BottomTabBarProps {
    scrollPosition?: SharedValue<number>;
    scrollOffset?: SharedValue<number>;
}

export const FloatingTabBar: React.FC<CustomTabBarProps> = ({
    state,
    navigation,
    scrollPosition,
    scrollOffset
}) => {
    const { theme, isDark } = useTheme();
    const tabPositions = useSharedValue<number[]>([0, 0, 0, 0, 0]);
    const indicatorOpacity = useSharedValue(1);

    const onTabLayout = useCallback((index: number, event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        const centerX = x + width / 2 - 3; // 3 = half of indicator 6
        const newPositions = [...tabPositions.value];
        newPositions[index] = centerX;
        tabPositions.value = newPositions;
    }, []);

    // Smoothly interpolate the indicator position
    const indicatorX = useDerivedValue(() => {
        if (!scrollPosition || !scrollOffset) {
            return tabPositions.value[state.index] || 0;
        }

        const total = scrollPosition.value + scrollOffset.value;

        // Tab indices: 0 (Home), 1 (Explore), 2 (Center/Create), 3 (Lists), 4 (Profile)
        // Pager indices: 0, 1, 2, 3

        if (total <= 1) {
            // Smoothly move between 0 and 1
            return interpolate(
                total,
                [0, 1],
                [tabPositions.value[0], tabPositions.value[1]]
            );
        } else if (total <= 2) {
            // Move between 1 and 2 (Tab 1 and Tab 3), skipping Tab 2
            return interpolate(
                total,
                [1, 2],
                [tabPositions.value[1], tabPositions.value[3]]
            );
        } else {
            // Move between 2 and 3 (Tab 3 and Tab 4)
            return interpolate(
                total,
                [2, 3],
                [tabPositions.value[3], tabPositions.value[4]]
            );
        }
    });

    // Add a stretch effect based on the transition progress
    const indicatorWidth = useDerivedValue(() => {
        if (!scrollOffset) return 6;
        const offset = scrollOffset.value;
        // Stretch in the middle of transition
        const stretch = Math.sin(offset * Math.PI) * 12;
        return 6 + stretch;
    });

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.value }],
        width: indicatorWidth.value,
        opacity: withTiming(state.routes[state.index].name === 'CreatePlaceholder' ? 0 : 1, { duration: 200 }),
    }));

    const handleTabPress = (index: number, routeName: string) => {
        // Opacity is now handled automatically by state.index check in useAnimatedStyle
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <View style={[styles.backgroundContainer, { borderColor: theme.border, backgroundColor: theme.glass }]}>
                    <BlurView
                        intensity={42}
                        tint={isDark ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFillObject}
                    />
                </View>
                <View style={styles.tabContent}>
                    {state.routes.map((route, index) => {
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                handleTabPress(index, route.name);
                                navigation.navigate(route.name);
                            }
                        };

                        const renderIcon = (name: string, color: string) => {
                            switch (name) {
                                case 'Feed': return <Home color={color} size={24} />;
                                case 'Explore': return <Compass color={color} size={24} />;
                                case 'CreatePlaceholder': return (
                                    <View style={styles.createButton}>
                                        <View style={styles.createButtonInner}>
                                            <PlusCircle color={colors.warmWhite} size={30} />
                                        </View>
                                    </View>
                                );
                                case 'Lists': return <Bookmark color={color} size={24} />;
                                case 'Profile': return <User color={color} size={24} />;
                                default: return null;
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                onLayout={(e) => onTabLayout(index, e)}
                                style={styles.tabItem}
                            >
                                {renderIcon(route.name, isFocused ? colors.saffron : theme.text)}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Animated sliding indicator */}
                <Animated.View
                    style={[
                        styles.indicator,
                        { backgroundColor: colors.saffron },
                        indicatorStyle,
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 18,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    tabBar: {
        height: 64,
        width: '100%',
        position: 'relative',
    },
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 32,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#0A6C40',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 7,
    },
    tabContent: {
        flexDirection: 'row',
        height: '100%',
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButton: {
        width: 66,
        height: 66,
        borderRadius: 33,
        alignItems: 'center',
        justifyContent: 'center',
        top: -20,
        borderWidth: 4,
        borderColor: '#DFF1E7',
        backgroundColor: 'rgba(20, 133, 74, 0.8)',
        shadowColor: '#0A6C40',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    createButtonInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        backgroundColor: 'rgba(20, 133, 74, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicator: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        height: 4,
        borderRadius: 2,
    },
});
