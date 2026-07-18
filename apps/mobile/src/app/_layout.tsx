import { CormorantGaramond_500Medium, CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AppProviders } from '../providers/app-providers';
import { lightTheme } from '../theme/tokens';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: lightTheme.background }} />;
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
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(seller)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </AppProviders>
  );
}
