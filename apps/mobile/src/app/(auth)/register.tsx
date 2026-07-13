import { RegisterForm } from '../../features/auth/auth-form';
import { Screen } from '../../components/ui';
import { mobileLayout } from '../../theme/tokens';
import { YStack } from 'tamagui';

export default function RegisterScreen() {
  return (
    <Screen>
      <YStack
        style={{
          flex: 1,
          width: '100%',
          maxWidth: mobileLayout.formMaxWidth,
          alignSelf: 'center',
          justifyContent: 'center',
        }}
      >
        <RegisterForm redirectTo="/" />
      </YStack>
    </Screen>
  );
}
