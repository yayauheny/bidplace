import { Stack } from 'expo-router';

import { ProtectedRoute } from '../../components/shared/protected-route';

export default function SellerLayout() {
  return (
    <ProtectedRoute requireVerifiedEmail>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}
