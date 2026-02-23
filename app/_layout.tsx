import { XPProvider } from '@/src/context/XPContext';
import { RootNavigator } from '@/src/navigation/RootNavigator';
import { ThemeProvider } from '@/src/theme/ThemeProvider';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <XPProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </XPProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
