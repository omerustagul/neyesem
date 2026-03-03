import {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold
} from '@expo-google-fonts/dm-sans';
import {
    Fraunces_600SemiBold
} from '@expo-google-fonts/fraunces';
import {
    JetBrainsMono_400Regular
} from '@expo-google-fonts/jetbrains-mono';
import {
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import {
    PlayfairDisplay_700Bold,
    useFonts
} from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './colors';
import { typography } from './typography';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    typography: typeof typography;
    onReady?: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@neyesem_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode, onReady?: () => void }> = ({ children, onReady }) => {
    const colorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isDark, setIsDark] = useState(colorScheme === 'dark');

    const [fontsLoaded, fontError] = useFonts({
        PlayfairDisplay_700Bold,
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_700Bold,
        Fraunces_600SemiBold,
        JetBrainsMono_400Regular,
        Montserrat_400Regular,
        Montserrat_500Medium,
        Montserrat_600SemiBold,
        Montserrat_700Bold,
    });

    // Load persisted theme
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedMode) {
                    setThemeModeState(savedMode as ThemeMode);
                }
            } catch (e) {
                console.error('Failed to load theme mode', e);
            }
        };
        loadTheme();
    }, []);

    // Update isDark based on themeMode and system scheme
    useEffect(() => {
        if (themeMode === 'system') {
            setIsDark(colorScheme === 'dark');
        } else {
            setIsDark(themeMode === 'dark');
        }
    }, [themeMode, colorScheme]);

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (e) {
            console.error('Failed to save theme mode', e);
        }
    };

    // We no longer hide the splash screen here, as we transition to an animated splash in the RootLayout
    // useEffect(() => {
    //     if (fontsLoaded || fontError) {
    //         SplashScreen.hideAsync();
    //     }
    // }, [fontsLoaded, fontError]);

    useEffect(() => {
        if (fontsLoaded || fontError) {
            onReady?.();
        }
    }, [fontsLoaded, fontError, onReady]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    const theme = isDark ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode, typography }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
