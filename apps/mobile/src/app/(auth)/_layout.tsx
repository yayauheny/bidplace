import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'transparentModal',
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'none',
      }}
    />
  );
}
