import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetView
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { colors } from '../../theme/colors';

interface GlassSheetProps {
    children: React.ReactNode;
    snapPoints?: string[];
    onClose?: () => void;
}

export const GlassSheet = React.forwardRef<BottomSheet, GlassSheetProps>(({
    children,
    snapPoints = ['25%', '50%', '90%'],
    onClose
}, ref) => {
    const { theme, isDark } = useTheme();

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    const backgroundComponent = useCallback(() => (
        <BlurView
            intensity={40}
            tint={isDark ? 'dark' : 'light'}
            style={[
                StyleSheet.absoluteFill,
                {
                    backgroundColor: isDark ? colors.glassDark : colors.glassLight,
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    overflow: 'hidden',
                }
            ]}
        />
    ), [isDark]);

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={onClose}
            backdropComponent={renderBackdrop}
            backgroundComponent={backgroundComponent}
            handleIndicatorStyle={{ backgroundColor: isDark ? colors.cream : colors.charcoalGrill }}
        >
            <BottomSheetView style={styles.contentContainer}>
                {children}
            </BottomSheetView>
        </BottomSheet>
    );
});

const styles = StyleSheet.create({
    contentContainer: {
        padding: 24,
        flex: 1,
    },
});
