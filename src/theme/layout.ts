import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HEADER_BASE_HEIGHT = 52;

// Global rounded corner tokens — softer, more modern look
export const radius = {
    xs: 8,
    sm: 14,
    md: 20,
    lg: 24,
    xl: 32,
    pill: 999,
};

export const useHeaderHeight = () => {
    const insets = useSafeAreaInsets();
    return HEADER_BASE_HEIGHT + insets.top;
};

export const useScreenPadding = () => {
    const headerHeight = useHeaderHeight();
    return {
        paddingTop: headerHeight + 8, // Standard padding below header
        headerHeight,
    };
};
