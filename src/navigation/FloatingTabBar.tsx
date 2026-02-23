import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Bookmark, Compass, Home, PlusCircle, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { colors } from '../theme/colors';

export const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
    const { theme, isDark } = useTheme();

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
                                navigation.navigate(route.name);
                            }
                        };

                        const renderIcon = (name: string, color: string) => {
                            switch (name) {
                                case 'Feed': return <Home color={color} size={24} />;
                                case 'Explore': return <Compass color={color} size={24} />;
                                case 'Create': return (
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
                                style={styles.tabItem}
                            >
                                {renderIcon(route.name, isFocused ? colors.saffron : theme.secondaryText)}
                                {isFocused && route.name !== 'Create' && (
                                    <Animated.View style={[styles.indicator, { backgroundColor: colors.saffron }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
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
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
    }
});
