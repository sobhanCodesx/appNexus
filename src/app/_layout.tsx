import {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
  Vazirmatn_900Black,
  useFonts,
} from '@expo-google-fonts/vazirmatn';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConnectivityBanner } from '@/components/system/connectivity-banner';
import { NavigationLoader } from '@/components/system/navigation-loader';
import { palette } from '@/design';
import { useNotificationNavigation } from '@/hooks/use-notification-navigation';
import { getAppMeta } from '@/services/app-meta';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useNotificationNavigation();

  const [fontsLoaded, fontError] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
    Vazirmatn_900Black,
  });

  useEffect(() => {
    void getAppMeta().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.ink },
            animation: 'fade_from_bottom',
            gestureEnabled: true,
          }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="search" options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="shorts" options={{ animation: 'fade' }} />
          <Stack.Screen name="stories" options={{ animation: 'fade' }} />
          <Stack.Screen name="content/[slug]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="product/[slug]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="channel/[slug]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="studio/[slug]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="collection/[slug]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="store" options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="cart" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="checkout" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/login" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="auth/register" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="auth/otp" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="auth/verify" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="auth/forgot" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <NavigationLoader />
        <ConnectivityBanner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink },
});
