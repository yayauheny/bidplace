import { LoginForm } from '../../features/auth/auth-form';
import { Screen } from '../../components/ui';
import { mobileLayout } from '../../theme/tokens';
import { YStack } from 'tamagui';

export default function LoginScreen() {
  return (
    <Screen mode="auth" showHeader={false}>
      <YStack
        style={{
          flex: 1,
          width: '100%',
          maxWidth: mobileLayout.formMaxWidth,
          alignSelf: 'center',
          justifyContent: 'center',
        }}
      >
        <LoginForm redirectTo="/" />
      </YStack>
    </Screen>
  );
}
