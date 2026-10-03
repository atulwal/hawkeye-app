import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdminPinModal } from '../components/common/AdminPinModal';
import { COLORS } from '../constants/theme';
import { AppProvider, useApp } from '../context/AppContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Set web base typography and remove focus outlines/underlines
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    *, *::before, *::after {
      -webkit-tap-highlight-color: transparent;
      outline: none !important;
    }
    *:focus, *:focus-visible, *:active {
      outline: none !important;
      box-shadow: none !important;
    }
    a, button, [role="tab"], [role="button"], [tabindex] {
      outline: none !important;
      box-shadow: none !important;
      text-decoration: none !important;
    }
    [role="tab"] > *, [role="tab"]::after {
      text-decoration: none !important;
    }
  `;
  document.head.appendChild(style);
}

function GlobalModals() {
  const {
    isAdmin,
    setIsAdmin,
    isPinModalVisible,
    closePinModal,
  } = useApp();

  return (
    <AdminPinModal
      visible={isPinModalVisible}
      isAdmin={isAdmin}
      onClose={closePinModal}
      onSuccess={() => {
        setIsAdmin(true);
        closePinModal();
      }}
      onLogout={() => {
        setIsAdmin(false);
        closePinModal();
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.page },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <GlobalModals />
        </View>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
});
