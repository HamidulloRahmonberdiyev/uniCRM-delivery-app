import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppSplash } from '@/components/app-splash';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { NotificationProvider } from '@/contexts/notification-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ensureYamapInitialized } from '@/lib/yandex-maps';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Yandex MapKit ni ilova ishga tushishida darhol init qilamiz,
// shunda Lokatsiya ekraniga kirilganda xarita tayyor bo'ladi.
ensureYamapInitialized();

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return <AppSplash />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking/[id]" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </NotificationProvider>
    </GestureHandlerRootView>
  );
}
