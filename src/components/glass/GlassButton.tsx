import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';
import { GlassSurface } from './GlassSurface';

interface GlassButtonProps {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlassButton: React.FC<GlassButtonProps> = ({
    title,
    onPress,
    style,
    textStyle,
    variant = 'primary',
    icon,
}) => {
    const { theme, typography } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const isPrimary = variant === 'primary';
    const isOutline = variant === 'outline';

    const buttonBackground =
        variant === 'primary' ? 'rgba(20, 133, 74, 0.76)' : theme.glass;
    const borderColor = isOutline ? theme.border : 'transparent';
    const borderWidth = isOutline ? 1 : 0;

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={() => {
                scale.value = withSpring(0.97);
            }}
            onPressOut={() => {
                scale.value = withSpring(1);
            }}
            style={[
                animatedStyle,
                styles.container,
                style,
            ]}
        >
            <GlassSurface
                borderRadius={16}
                intensity={38}
                withShadow
                backgroundColor={buttonBackground}
                borderColor={borderColor}
                borderWidth={borderWidth}
                style={styles.fill}
                contentStyle={styles.content}
            >
                <View style={styles.row}>
                    {icon && icon}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: isPrimary ? colors.warmWhite : theme.text,
                                fontFamily: typography.bodyMedium,
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </View>
            </GlassSurface>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
    },
    fill: {
        width: '100%',
    },
    content: {
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
    },
});
