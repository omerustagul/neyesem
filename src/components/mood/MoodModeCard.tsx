import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring, withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { MoodMode } from '../../types/mood.types';

type Props = {
    mode: MoodMode;
    isSelected: boolean;
    onPress: () => void;
};

export default function MoodModeCard({ mode, isSelected, onPress }: Props) {
    const { theme, isDark, typography } = useTheme();
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const handlePress = () => {
        scale.value = withSpring(0.95, { damping: 15 }, () => {
            scale.value = withSpring(1, { damping: 10 });
        });
        glowOpacity.value = withTiming(1, { duration: 150 }, () => {
            glowOpacity.value = withTiming(0, { duration: 300 });
        });
        onPress();
    };

    return (
        <Animated.View style={[styles.wrapper, animStyle]}>
            {/* Seçili glow efekti */}
            {isSelected && (
                <Animated.View style={[styles.selectedGlow, glowStyle, {
                    shadowColor: mode.gradient[0],
                }]} />
            )}

            <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                <LinearGradient
                    colors={isSelected
                        ? mode.gradient
                        : isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#fff', '#f9f9f9']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.card,
                        {
                            borderColor: isSelected
                                ? mode.gradient[0]
                                : theme.border,
                            borderWidth: isSelected ? 1.5 : 1,
                        }
                    ]}
                >
                    {/* Emoji */}
                    <Text style={styles.emoji}>{mode.emoji}</Text>

                    {/* İsim */}
                    <Text style={[
                        styles.name,
                        { color: isSelected ? '#fff' : theme.text, fontFamily: typography.display }
                    ]}>
                        {mode.name}
                    </Text>

                    {/* Açıklama */}
                    <Text style={[
                        styles.description,
                        { color: isSelected ? 'rgba(255,255,255,0.7)' : theme.secondaryText, fontFamily: typography.body }
                    ]}
                        numberOfLines={2}
                    >
                        {mode.description}
                    </Text>

                    {/* Seçili indicator */}
                    {isSelected && (
                        <View style={styles.selectedDot} />
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: 150,
        marginRight: 12,
    },
    card: {
        borderRadius: 24,
        padding: 16,
        minHeight: 140,
        overflow: 'hidden',
    },
    selectedGlow: {
        position: 'absolute',
        top: -4, left: -4, right: -4, bottom: -4,
        borderRadius: 28,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    emoji: {
        fontSize: 28,
        marginBottom: 8,
    },
    name: {
        fontSize: 15,
        marginBottom: 4,
    },
    description: {
        fontSize: 11,
        lineHeight: 15,
    },
    selectedDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
});
