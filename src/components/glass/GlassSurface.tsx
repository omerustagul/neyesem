import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface GlassSurfaceProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    borderRadius?: number;
    intensity?: number;
    withShadow?: boolean;
    shadowStyle?: StyleProp<ViewStyle>;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
    children,
    style,
    contentStyle,
    borderRadius = 20,
    intensity = 36,
    withShadow = false,
    shadowStyle,
    backgroundColor,
    borderColor,
    borderWidth = 1,
}) => {
    const { theme, isDark } = useTheme();

    return (
        <View style={[withShadow && styles.shadow, shadowStyle, style]}>
            <View
                style={[
                    styles.glass,
                    {
                        borderRadius,
                        backgroundColor: backgroundColor ?? theme.glass,
                        borderColor: borderColor ?? theme.border,
                        borderWidth,
                    },
                    (style as any)?.height || (style as any)?.flex ? { flex: 1 } : {}
                ]}
            >
                <BlurView
                    intensity={intensity}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={[(style as any)?.height || (style as any)?.flex ? { flex: 1 } : {}, contentStyle]}>
                    {children}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    glass: {
        overflow: 'hidden',
    },
    shadow: {
        shadowColor: '#0A6C40',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
    },
});
