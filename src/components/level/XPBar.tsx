import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

interface XPBarProps {
    xp: number;
    xpNext: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, xpNext }) => {
    const { theme, typography } = useTheme();
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withSpring(Math.min(xp / xpNext, 1));
    }, [xp, xpNext]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <View style={styles.container}>
            <View style={[styles.barBackground, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Animated.View style={[styles.barForeground, { backgroundColor: colors.saffron }, animatedStyle]} />
            </View>
            <View style={styles.labels}>
                <Text style={[styles.xpText, { color: theme.secondaryText, fontFamily: typography.mono }]}>
                    {xp} XP
                </Text>
                <Text style={[styles.xpText, { color: theme.secondaryText, fontFamily: typography.mono }]}>
                    {xpNext} XP
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 10,
    },
    barBackground: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%',
    },
    barForeground: {
        height: '100%',
        borderRadius: 4,
    },
    labels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    xpText: {
        fontSize: 10,
    },
});
