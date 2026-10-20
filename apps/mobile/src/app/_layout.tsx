import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { ensureAuthBrowserHistory } from '../features/auth/auth-browser-history';
import { SearchOverlayHost } from '../features/search/search-overlay-host';
import { AppProviders } from '../providers/app-providers';
import { useAppTheme } from '../providers/theme-provider';
import '../../global.css';

ensureAuthBrowserHistory();

export const unstable_settings = { anchor: 'index' };

export default function RootLayout() {
  // Falls back to the light palette while providers are not mounted yet.
  const palette = useAppTheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: palette.canvas }} />;
  }

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{ presentation: 'transparentModal', animation: 'none' }}
        />
        <Stack.Screen name="(seller)" />
        <Stack.Screen name="(account)" />
        <Stack.Screen name="(admin)" />
      </Stack>
      <SearchOverlayHost />
    </AppProviders>
  );
}
