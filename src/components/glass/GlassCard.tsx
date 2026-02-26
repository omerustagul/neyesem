import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { GlassSurface } from './GlassSurface';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    intensity?: number;
    borderRadius?: number;
    withShadow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    contentStyle,
    intensity = 32,
    borderRadius = 28,
    withShadow = true,
}) => {
    return (
        <GlassSurface
            style={style}
            borderRadius={borderRadius}
            intensity={intensity}
            withShadow={withShadow}
            contentStyle={[{ padding: 14 }, contentStyle]}
        >
            {children}
        </GlassSurface>
    );
};
