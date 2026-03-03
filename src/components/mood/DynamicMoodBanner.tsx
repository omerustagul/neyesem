import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { MoodMode } from '../../types/mood.types';

type Props = {
    mode: MoodMode;
    onPress: () => void;
};

export default function DynamicMoodBanner({ mode, onPress }: Props) {
    const { theme, typography } = useTheme();
    const pulseAnim = useSharedValue(1);

    useEffect(() => {
        pulseAnim.value = withRepeat(
            withSequence(
                withTiming(1.02, { duration: 1500 }),
                withTiming(1.00, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseAnim.value }],
    }));

    return (
        <Animated.View style={[styles.wrapper, pulseStyle]}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                <LinearGradient
                    colors={mode.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.banner}
                >
                    <View style={styles.left}>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={[styles.liveText, { fontFamily: typography.bodyMedium }]}>ŞU AN</Text>
                        </View>
                        <Text style={[styles.title, { fontFamily: typography.display }]}>
                            {mode.emoji} {mode.name} Modu
                        </Text>
                        <Text style={[styles.subtitle, { fontFamily: typography.body }]}>
                            {mode.description}
                        </Text>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#F4A418',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
    },
    left: {
        flex: 1,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#fff',
        marginRight: 6,
    },
    liveText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 20,
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
    },
    arrow: {
        fontSize: 24,
        color: '#fff',
        marginLeft: 12,
    },
});
