import { Stack } from 'expo-router';

import { ProtectedRoute } from '../../components/shared/protected-route';

// Личный аккаунт доступен любому signed-in пользователю; verified email
// требуется только у (seller) — редактор и work flows не переопределяются.
export default function AccountLayout() {
  return (
    <ProtectedRoute>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}
