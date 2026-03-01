import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TextProps } from 'react-native';

interface GradientTextProps extends TextProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
}

export const GradientText: React.FC<GradientTextProps> = ({ colors, start, end, style, children, ...rest }) => {
    return (
        <MaskedView maskElement={<Text style={[style, { backgroundColor: 'transparent' }]} {...rest}>{children}</Text>}>
            <LinearGradient
                colors={colors as [string, string, ...string[]]}
                start={start || { x: 0, y: 0 }}
                end={end || { x: 1, y: 0 }}
            >
                <Text style={[style, { opacity: 0 }]} {...rest}>
                    {children}
                </Text>
            </LinearGradient>
        </MaskedView>
    );
};
