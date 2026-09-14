import { type ReactNode, useRef } from 'react';
import { useIsFocused } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { OverlayHost } from './OverlayHost';
import { SessionAlert } from './SessionAlert';
import { FloatingDock } from '../figma/FloatingDock';
import { useAuth } from '../../providers/auth-provider';

export function AppShell({
  children,
  bottomAction,
  hideDock = false,
  showSessionAlert = true,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  hideDock?: boolean;
  showSessionAlert?: boolean;
}) {
  const dockBlurTarget = useRef<View | null>(null);
  const isFocused = useIsFocused();
  const auth = useAuth();
  const sessionAlertVisible = showSessionAlert && auth.status === 'error';

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
          <SessionAlert
            visible={sessionAlertVisible}
            onRetry={() => void auth.refreshSession()}
          />
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
