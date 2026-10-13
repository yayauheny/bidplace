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
  contentMaxWidth = designTokens.layout.phoneWidth,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  hideDock?: boolean;
  contentMaxWidth?: number;
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
            maxWidth: contentMaxWidth,
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
          // Focus only mounts the body-portaled dock so stacked screens do
          // not paint multiple docks. It must not change page content.
          <FloatingDock blurTarget={dockBlurTarget} />
        ) : null}
      </SafeAreaView>
    </OverlayHost>
  );
}
