import { Stack } from 'expo-router';

import { PublicNavigationProvider } from '../../components/layout/public-navigation';

export default function PublicLayout() {
  return (
    <PublicNavigationProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PublicNavigationProvider>
  );
}
