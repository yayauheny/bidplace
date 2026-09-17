import { type ReactNode, useRef } from 'react';
import { useIsFocused } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { OverlayHost } from './OverlayHost';
import { FloatingDock } from '../figma/FloatingDock';

export function AppShell({
  children,
  bottomAction,
  hideDock = false,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  hideDock?: boolean;
}) {
  const dockBlurTarget = useRef<View | null>(null);
  const isFocused = useIsFocused();

  return (
    <OverlayHost>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: designTokens.color.canvas,
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
            alignSelf: 'center',
            overflow: 'visible',
          }}
        >
          {children}
          {bottomAction ? (
            <View
              style={{
                paddingHorizontal: designTokens.space.pageGutter,
                paddingBottom: hideDock
                  ? designTokens.space.x4
                  : designTokens.size.dockReserve,
              }}
            >
              {bottomAction}
            </View>
          ) : null}
        </BlurTargetView>
        {!hideDock && isFocused ? (
          <FloatingDock blurTarget={dockBlurTarget} />
        ) : null}
      </SafeAreaView>
    </OverlayHost>
  );
}
