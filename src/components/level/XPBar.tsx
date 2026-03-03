import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface XPBarProps {
    xp: number;
    xpNext: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, xpNext }) => {
    const progress = useSharedValue(0);
    const shimmerX = useSharedValue(-1);

    useEffect(() => {
        // Fill animation from 0 to current
        progress.value = withTiming(Math.min(xp / xpNext, 1), {
            duration: 1200,
            easing: Easing.out(Easing.cubic),
        });
        // Shimmer loop
        shimmerX.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            false
        );
    }, [xp, xpNext]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerX.value * 200 }],
        opacity: 0.35,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.barBackground}>
                <Animated.View style={[styles.barForeground, barStyle]}>
                    <Animated.View style={[styles.shimmer, shimmerStyle]} />
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    barBackground: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    barForeground: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: colors.saffron,
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 60,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 4,
    },
});
