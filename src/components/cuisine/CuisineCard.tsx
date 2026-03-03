import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { Cuisine } from '../../types/cuisine.types';

type Props = {
    cuisine: Cuisine;
    isSelected: boolean;
    onPress: () => void;
};

export default function CuisineCard({ cuisine, isSelected, onPress }: Props) {
    const { theme, isDark, typography } = useTheme();
    const scale = useSharedValue(1);
    const Icon = cuisine.icon;

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        scale.value = withSpring(0.95, { damping: 15 }, () => {
            scale.value = withSpring(1, { damping: 10 });
        });
        onPress();
    };

    return (
        <Animated.View style={[styles.wrapper, animStyle]}>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                <LinearGradient
                    colors={isSelected
                        ? cuisine.gradient
                        : isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#fff', '#f9f9f9']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.card,
                        {
                            borderColor: isSelected
                                ? cuisine.gradient[0]
                                : theme.border,
                            borderWidth: isSelected ? 1.5 : 1,
                        }
                    ]}
                >
                    <View style={[styles.iconWrap, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${cuisine.gradient[0]}15` }]}>
                        <Icon size={20} color={isSelected ? '#fff' : cuisine.gradient[0]} />
                    </View>

                    <Text style={[
                        styles.name,
                        { color: isSelected ? '#fff' : theme.text, fontFamily: typography.bodyMedium }
                    ]}>
                        {cuisine.name}
                    </Text>

                    <Text style={[
                        styles.count,
                        { color: isSelected ? 'rgba(255,255,255,0.7)' : theme.secondaryText, fontFamily: typography.body }
                    ]}>
                        {cuisine.count} tarif
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: 120,
        marginRight: 10,
    },
    card: {
        borderRadius: 20,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 110,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 2,
    },
    count: {
        fontSize: 10,
        textAlign: 'center',
    },
});
