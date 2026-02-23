import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

interface LevelBadgeProps {
    level: number;
    size?: number;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 40 }) => {
    const { theme, typography } = useTheme();

    return (
        <View style={[
            styles.container,
            {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.saffron,
                borderColor: colors.glassBorder,
            }
        ]}>
            <Text style={[
                styles.text,
                { fontSize: size * 0.4, color: colors.charcoalGrill, fontFamily: typography.mono }
            ]}>
                {level}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: colors.saffron,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    text: {
        fontWeight: 'bold',
    },
});
