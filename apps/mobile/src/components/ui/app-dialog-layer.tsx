import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import * as Dialog from '@rn-primitives/dialog';

export function AppDialogOverlay({
  style,
  forceMount,
}: {
  style: StyleProp<ViewStyle>;
  forceMount?: true;
}) {
  return (
    <Dialog.Overlay
      closeOnPress
      forceMount={forceMount}
      style={[{ position: 'absolute' }, style]}
    />
  );
}

export function AppDialogFrame({
  style,
  children,
}: {
  style: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View nativeID="app-dialog-host" style={[{ position: 'absolute' }, style]}>
      {children}
    </View>
  );
}
