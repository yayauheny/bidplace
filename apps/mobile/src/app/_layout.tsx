import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { SearchOverlayHost } from '../features/search/search-overlay-host';
import { AppProviders } from '../providers/app-providers';
import '../../global.css';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: designTokens.color.canvas }} />
    );
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
        <Stack.Screen name="(seller)" />
        <Stack.Screen name="(admin)" />
      </Stack>
      <SearchOverlayHost />
    </AppProviders>
  );
}
