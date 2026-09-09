import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { OverlayHost } from './OverlayHost';
import { AppText } from '../ui/AppText';
import { FigmaButton } from '../figma/FigmaButton';
import { FloatingDock } from '../figma/FloatingDock';
import { useAuth } from '../../providers/auth-provider';

export function AppShell({
  children,
  hideDock = false,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  ambientVariant?: string;
  hideDock?: boolean;
}) {
  const auth = useAuth();

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
        {auth.status === 'error' ? (
          <View
            accessibilityRole="alert"
            style={{
              width: '100%',
              maxWidth: designTokens.layout.phoneWidth,
              minHeight: designTokens.size.touch,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: designTokens.space.x3,
              paddingHorizontal: designTokens.space.pageGutter,
              paddingVertical: designTokens.space.x2,
              backgroundColor: designTokens.color.canvas,
              borderBottomWidth: 1,
              borderBottomColor: designTokens.color.border,
            }}
          >
            <AppText role="bodySmall" tone="danger">
              {auth.sessionError}
            </AppText>
            <FigmaButton
              label="Повторить"
              variant="outline"
              onPress={() => void auth.refreshSession()}
            />
          </View>
        ) : null}
        <View
          testID="app-shell-content"
          style={{
            flex: 1,
            width: '100%',
            maxWidth: designTokens.layout.phoneWidth,
            minWidth: 0,
            overflow: 'visible',
            paddingBottom: hideDock ? 0 : designTokens.size.dockReserve,
          }}
        >
          {children}
        </View>
        {hideDock ? null : <FloatingDock />}
      </SafeAreaView>
    </OverlayHost>
  );
}
