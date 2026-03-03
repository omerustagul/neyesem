import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
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
        // Total sequence: ~500ms
        // 1. Logo Entry (200ms)
        logoOpacity.value = withTiming(1, { duration: 250 });
        logoScale.value = withSpring(1, { damping: 12, stiffness: 120 });

        // 2. Title & Shine (Concurrent with logo, 300ms)
        titleOpacity.value = withDelay(150, withTiming(1, { duration: 250 }));
        titleY.value = withDelay(150, withSpring(0, { damping: 15, stiffness: 100 }));

        // 3. Fade out and Finish (Starts at 500ms mark)
        containerOpacity.value = withDelay(
            650,
            withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) }, (finished) => {
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
        <Animated.View style={[styles.container, containerStyle, { backgroundColor: isDark ? '#080e0b' : '#F8FAF9' }]}>
            {/* Ambient Background Glow */}
            <View style={[styles.ambientGlow, { backgroundColor: `${colors.saffron}05` }]} />

            {/* Logo Container with Glass Effect */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <View style={styles.glassCircle}>
                    <BlurView
                        intensity={isDark ? 20 : 40}
                        tint={isDark ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFill}
                    />
                    <Image
                        source={isDark ? require('../../assets/images/app_n_logo_dark_theme.webp') : require('../../assets/images/app_n_logo_light_theme.webp')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
            </Animated.View>

            {/* Title & Tagline */}
            <Animated.View style={[styles.titleContainer, titleStyle]}>
                <Text style={[styles.appName, { fontFamily: typography.display, color: isDark ? '#FFF' : '#1A1A1A' }]}>neyesem</Text>
                <View style={styles.taglineRow}>
                    <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,178,0,0.3)' : 'rgba(255,178,0,0.2)' }]} />
                    <Text style={[styles.tagline, { fontFamily: typography.bodyMedium, color: colors.saffron }]}>LEZZETİ KEŞFET</Text>
                    <View style={[styles.line, { backgroundColor: isDark ? 'rgba(255,178,0,0.3)' : 'rgba(255,178,0,0.2)' }]} />
                </View>
            </Animated.View>

            {/* Bottom Version */}
            <View style={styles.bottomVersion}>
                <Text style={[styles.versionText, { color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)' }]}>PREMIUM EXPERIENCE</Text>
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
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: width * 0.6,
    },
    logoContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glassCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    logo: {
        width: 70,
        height: 70,
    },
    titleContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    appName: {
        fontSize: 38,
        letterSpacing: 4,
        fontWeight: '200',
    },
    taglineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    tagline: {
        fontSize: 11,
        letterSpacing: 5,
        marginHorizontal: 15,
    },
    line: {
        width: 30,
        height: 1,
    },
    bottomVersion: {
        position: 'absolute',
        bottom: 60,
    },
    versionText: {
        fontSize: 10,
        letterSpacing: 3,
        fontWeight: '600',
    }
});
