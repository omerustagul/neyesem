import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Bookmark, Compass, Dna, Home, User } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH - 40;
const TAB_CONTENT_WIDTH = TAB_BAR_WIDTH - 24;
const TAB_WIDTH = TAB_CONTENT_WIDTH / 5;

const SPRING_CONFIG = { damping: 20, stiffness: 250, mass: 0.8 };

// Estimated initial positions to avoid indicator flickering or disappearing
const INITIAL_POSITIONS = [
    12 + TAB_WIDTH * 0.5 - 3,
    12 + TAB_WIDTH * 1.5 - 3,
    12 + TAB_WIDTH * 2.5 - 3,
    12 + TAB_WIDTH * 3.5 - 3,
    12 + TAB_WIDTH * 4.5 - 3,
];

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
    const tabPositions = useSharedValue<number[]>(INITIAL_POSITIONS);

    const onTabLayout = useCallback((index: number, event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        const centerX = x + width / 2 - 3; // 3 = half of indicator 6

        // Use a worklet-safe update to the array
        const newPositions = [...tabPositions.value];
        newPositions[index] = centerX;
        tabPositions.value = newPositions;
    }, []);

    const indicatorStyle = useAnimatedStyle(() => {
        const activeIndex = state.index;
        const pos = tabPositions.value;

        // Base position from the current measured tab layout
        let x = pos[activeIndex] || 0;

        // If we have real-time scroll data from PagerView, use it for smooth sliding
        if (scrollPosition && scrollOffset) {
            const total = scrollPosition.value + scrollOffset.value;

            // Interpolate between the measured positions based on scroll progress
            if (total <= 1) {
                x = interpolate(total, [0, 1], [pos[0], pos[1]]);
            } else if (total <= 2) {
                x = interpolate(total, [1, 2], [pos[1], pos[2]]);
            } else if (total <= 3) {
                x = interpolate(total, [2, 3], [pos[2], pos[3]]);
            } else if (total <= 4) {
                x = interpolate(total, [3, 4], [pos[3], pos[4]]);
            } else {
                x = pos[4];
            }
        }

        // Hide indicator if we haven't measured the position yet (except for index 0 which might be 0)
        const isReady = x > 0 || activeIndex === 0;

        return {
            transform: [{
                translateX: withSpring(x, SPRING_CONFIG)
            }],
            width: 6,
            opacity: withTiming(
                isReady ? 1 : 0,
                { duration: 240 }
            ),
        };
    }, [state.index, scrollPosition, scrollOffset]);

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
                                case 'Pantry': return <Dna color={color} size={24} />;
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
        height: '100%',
    },
    indicator: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        height: 4,
        borderRadius: 2,
    },
});
