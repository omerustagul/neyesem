import React from 'react';
import { StyleSheet, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { GlassSurface } from './GlassSurface';

interface GlassInputProps extends TextInputProps {
    containerStyle?: ViewStyle;
}

export const GlassInput: React.FC<GlassInputProps> = ({ containerStyle, ...props }) => {
    const { theme, isDark, typography } = useTheme();

    return (
        <GlassSurface
            style={[styles.container, containerStyle]}
            borderRadius={18}
            intensity={28}
            backgroundColor={isDark ? 'rgba(255, 255, 255, 0.08)' : theme.glass}
            borderColor={theme.border}
            contentStyle={styles.content}
        >
            <TextInput
                {...props}
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.45)' : '#90B09D'}
                style={[
                    styles.input,
                    {
                        color: theme.text,
                        fontFamily: typography.body,
                    },
                    props.style,
                ]}
            />
        </GlassSurface>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    input: {
        flex: 1,
        fontSize: 17,
    },
});
