import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { modernTokens } from '@bidplace/design-tokens';
import { RegisterForm } from '../../features/auth/auth-form';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
export default function RegisterScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();
  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        backgroundColor: modernTokens.color.canvas,
        padding: modernTokens.space.x5,
      }}
    >
      <View style={{ width: '100%', maxWidth: 540, alignSelf: 'center' }}>
        <RegisterForm redirectTo={getSafeRedirect(redirectTo)} />
      </View>
    </SafeAreaView>
  );
}
