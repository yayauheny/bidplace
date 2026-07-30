import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { modernTokens } from '@bidplace/design-tokens';

import { AppHeader } from './AppHeader';
import { AccountMenu } from './AccountMenu';

export function AppShell({
  children,
  bottomAction,
  mode = 'public',
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  mode?: 'public' | 'seller' | 'admin' | 'auth';
}) {
  void mode;
  const { width } = useWindowDimensions();
  const desktop = width >= 1025;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: modernTokens.color.canvas }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: desktop ? 'row' : 'column',
        }}
      >
        <AppHeader />
        <View style={{ flex: 1, minWidth: 0, backgroundColor: modernTokens.color.canvas }}>
          <View
            style={{
              minHeight: 56,
              alignItems: 'flex-end',
              justifyContent: 'center',
              borderBottomWidth: 1,
              borderBottomColor: modernTokens.color.border,
              backgroundColor: modernTokens.color.surface,
              paddingHorizontal: desktop ? modernTokens.space.x8 : modernTokens.space.x5,
            }}
          >
            <AccountMenu />
          </View>
          {children}
          {bottomAction}
        </View>
      </View>
    </SafeAreaView>
  );
}
