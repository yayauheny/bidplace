import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { LoginForm } from '../../features/auth/auth-form';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
import { AuthViewport } from '../../components/layout/AuthViewport';
export default function LoginScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();
  return (
    <AuthViewport>
      <View style={{ width: '100%', maxWidth: 540, alignSelf: 'center' }}>
        <LoginForm redirectTo={getSafeRedirect(redirectTo)} />
      </View>
    </AuthViewport>
  );
}
