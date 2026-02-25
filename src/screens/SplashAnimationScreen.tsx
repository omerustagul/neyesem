import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface SplashAnimationScreenProps {
    onAnimationComplete: () => void;
}

export const SplashAnimationScreen: React.FC<SplashAnimationScreenProps> = ({ onAnimationComplete }) => {
    const { typography, isDark } = useTheme();

    // Animation values
    const logoScale = useSharedValue(0.3);
    const logoOpacity = useSharedValue(0);
    const glowOpacity = useSharedValue(0);
    const glowScale = useSharedValue(0.8);
    const titleOpacity = useSharedValue(0);
    const titleY = useSharedValue(30);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        startAnimation();
    }, []);

    const startAnimation = () => {
        // 1. Logo Entry
        logoOpacity.value = withTiming(1, { duration: 600 });
        logoScale.value = withSequence(
            withSpring(1.2, { damping: 12, stiffness: 100 }),
            withSpring(1, { damping: 15, stiffness: 100 })
        );

        // 2. Glow Pulse
        glowOpacity.value = withDelay(
            300,
            withRepeat(
                withSequence(
                    withTiming(0.6, { duration: 800 }),
                    withTiming(0.2, { duration: 800 })
                ),
                -1,
                true
            )
        );
        glowScale.value = withDelay(
            300,
            withRepeat(
                withSequence(
                    withTiming(1.4, { duration: 800 }),
                    withTiming(1.1, { duration: 800 })
                ),
                -1,
                true
            )
        );

        // 3. Title Entry
        titleOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
        titleY.value = withDelay(
            600,
            withSpring(0, { damping: 15, stiffness: 100 })
        );

        // 4. Fade out and Finish
        containerOpacity.value = withDelay(
            2200,
            withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }, (finished) => {
                if (finished) {
                    runOnJS(onAnimationComplete)();
                }
            })
        );
    };

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: glowOpacity.value,
    }));

    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleY.value }],
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle, { backgroundColor: isDark ? '#080e0b' : '#F0F4F1' }]}>
            {/* Ambient Background Glow */}
            <View style={styles.ambientGlow} />

            {/* Pulsing Glow Rings */}
            <Animated.View style={[styles.glowRing, glowStyle, { borderColor: `${colors.saffron}66` }]} />
            <Animated.View style={[styles.glowRingOuter, glowStyle, { borderColor: `${colors.saffron}33` }]} />

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <Image
                    source={isDark ? require('../../assets/images/app_n_logo_dark_theme.webp') : require('../../assets/images/app_n_logo_light_theme.webp')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Title & Tagline */}
            <Animated.View style={[styles.titleContainer, titleStyle]}>
                <Text style={[styles.appName, { fontFamily: typography.display, color: isDark ? '#FFF' : colors.saffron }]}>neyesem</Text>
                <View style={styles.taglineRow}>
                    <View style={[styles.line, { backgroundColor: `${colors.saffron}4D` }]} />
                    <Text style={[styles.tagline, { fontFamily: typography.body, color: colors.saffron }]}>LEZZETİ KEŞFET</Text>
                    <View style={[styles.line, { backgroundColor: `${colors.saffron}4D` }]} />
                </View>
            </Animated.View>

            {/* Bottom Version (Optional) */}
            <View style={styles.bottomVersion}>
                <Text style={styles.versionText}>v1.0.0</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ambientGlow: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width * 0.75,
        backgroundColor: `${colors.saffron}08`,
    },
    glowRing: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 1,
    },
    glowRingOuter: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        borderWidth: 1,
    },
    logoContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.saffron,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    logo: {
        width: 100,
        height: 100,
    },
    titleContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    appName: {
        fontSize: 42,
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    taglineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    tagline: {
        fontSize: 12,
        letterSpacing: 4,
        marginHorizontal: 12,
    },
    line: {
        width: 20,
        height: 1,
    },
    bottomVersion: {
        position: 'absolute',
        bottom: 50,
    },
    versionText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.3)',
        letterSpacing: 2,
    }
});
