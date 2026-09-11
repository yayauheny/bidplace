import { type ReactNode, useRef } from 'react';
import { BlurTargetView } from 'expo-blur';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { OverlayHost } from './OverlayHost';
import { FloatingDock } from '../figma/FloatingDock';

export function AppShell({
  children,
  hideDock = false,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  ambientVariant?: string;
  hideDock?: boolean;
}) {
  const dockBlurTarget = useRef<View | null>(null);

  return (
    <OverlayHost>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: designTokens.color.canvas,
          alignItems: 'center',
          overflow: 'visible',
        }}
      >
        <BlurTargetView
          ref={dockBlurTarget}
          testID="app-shell-content"
          style={{
            flex: 1,
            width: '100%',
            maxWidth: designTokens.layout.phoneWidth,
            minWidth: 0,
            overflow: 'visible',
          }}
        >
          {children}
        </BlurTargetView>
        {hideDock ? null : <FloatingDock blurTarget={dockBlurTarget} />}
      </SafeAreaView>
    </OverlayHost>
  );
}
