import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  sheetBackdropEnter,
  sheetBackdropExit,
} from '../../lib/layout-transition';
import { useAppTheme } from '../../providers/theme-provider';

export default function AuthLayout() {
  const palette = useAppTheme();
  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        nativeID="auth-backdrop"
        pointerEvents="none"
        entering={sheetBackdropEnter}
        exiting={sheetBackdropExit}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: palette.modalDimmer },
        ]}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'none',
        }}
      />
    </View>
  );
}
