import { type ReactNode, useRef } from 'react';
import { useIsFocused } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { OverlayHost } from './OverlayHost';
import { FloatingDock } from '../figma/FloatingDock';
import { AppText, SecondaryButton } from '../ui';
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
          {sessionAlertVisible ? (
            <View
              accessibilityRole="alert"
              style={{
                minHeight: designTokens.size.touch,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: designTokens.space.x3,
                paddingHorizontal: designTokens.space.pageGutter,
                paddingVertical: designTokens.space.x2,
                backgroundColor: designTokens.color.surface,
                borderBottomWidth: 1,
                borderBottomColor: designTokens.color.border,
              }}
            >
              <AppText role="bodySmall" tone="danger">
                Не удалось проверить сессию
              </AppText>
              <SecondaryButton
                label="Повторить проверку сессии"
                onPress={() => void auth.refreshSession()}
              />
            </View>
          ) : null}
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
