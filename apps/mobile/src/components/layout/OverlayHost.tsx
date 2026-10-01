import { type ReactNode } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export function OverlayHost({ children }: { children: ReactNode }) {
  return (
    <>
      <View style={{ flex: 1, position: 'relative' }}>{children}</View>
      <View
        nativeID="app-overlay-host"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: designTokens.layer.popover,
          pointerEvents: 'none',
        }}
      >
        <View style={{ width: 0, height: 0, pointerEvents: 'auto' }} />
      </View>
    </>
  );
}
