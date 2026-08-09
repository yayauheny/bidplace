import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { AppHeader } from './AppHeader';
import { OverlayHost } from './OverlayHost';

export function AppShell({
  children,
  bottomAction,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
}) {
  return (
    <OverlayHost>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: designTokens.color.canvas }}
      >
        <View
          style={{
            flex: 1,
            minHeight: 0,
          }}
        >
          <AppHeader />
          <View
            testID="app-shell-content"
            style={{
              flex: 1,
              minWidth: 0,
              backgroundColor: designTokens.color.canvas,
            }}
          >
            {children}
            {bottomAction}
          </View>
        </View>
      </SafeAreaView>
    </OverlayHost>
  );
}
