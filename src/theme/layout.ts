import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HEADER_BASE_HEIGHT = 52;

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
