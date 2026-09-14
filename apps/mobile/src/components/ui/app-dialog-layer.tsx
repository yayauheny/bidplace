import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import * as Dialog from '@rn-primitives/dialog';

export function AppDialogOverlay({ style }: { style: StyleProp<ViewStyle> }) {
  return (
    <Dialog.Overlay closeOnPress style={[{ position: 'absolute' }, style]} />
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
