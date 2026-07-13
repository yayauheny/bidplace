import { Stack } from 'expo-router';

import { ProtectedRoute } from '../../components/shared/protected-route';

export default function AdminLayout() {
  return (
    <ProtectedRoute requireAdmin>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}
