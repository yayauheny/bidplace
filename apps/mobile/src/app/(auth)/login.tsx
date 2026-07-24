import { useLocalSearchParams } from 'expo-router';
import { LoginForm } from '../../features/auth/auth-form';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
import { Screen } from '../../components/ui';
import { mobileLayout } from '../../theme/tokens';
import { YStack } from 'tamagui';

export default function LoginScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();

  const safeRedirect = getSafeRedirect(redirectTo);

  return (
    <Screen mode="auth" showHeader={false}>
      <YStack
        flex={1}
        style={{
          width: '100%',
          maxWidth: mobileLayout.formMaxWidth,
          alignSelf: 'center',
          justifyContent: 'center',
        }}
      >
        <LoginForm redirectTo={safeRedirect} />
      </YStack>
    </Screen>
  );
}
