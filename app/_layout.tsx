import { NotificationProvider } from '@/src/context/NotificationContext';
import { XPProvider } from '@/src/context/XPContext';
import { RootNavigator } from '@/src/navigation/RootNavigator';
import { SplashAnimationScreen } from '@/src/screens/SplashAnimationScreen';
import { ThemeProvider } from '@/src/theme/ThemeProvider';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Provider as PaperProvider } from 'react-native-paper';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // This effect runs once the layout is ready
    setAppReady(true);
  }, []);

  const handleAnimationComplete = () => {
    setIsAnimationComplete(true);
  };

  const handleFontsReady = async () => {
    setAppReady(true);
    // Hide native splash immediately once fonts are ready
    // This allows the animated SplashAnimationScreen (child of ThemeProvider) to be visible instantly
    await SplashScreen.hideAsync();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <ThemeProvider onReady={handleFontsReady}>
          {!isAnimationComplete ? (
            <SplashAnimationScreen onAnimationComplete={handleAnimationComplete} />
          ) : (
            <NotificationProvider>
              <XPProvider>
                <RootNavigator />
                <StatusBar style="auto" />
              </XPProvider>
            </NotificationProvider>
          )}
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
