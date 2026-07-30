import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { modernTokens } from '@bidplace/design-tokens';

import { AppHeader } from './AppHeader';

export function AppShell({
  children,
  bottomAction,
  mode = 'public',
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  mode?: 'public' | 'seller' | 'admin' | 'auth';
}) {
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
        <AppHeader mode={mode} />
        <View style={{ flex: 1, minWidth: 0 }}>
          {children}
          {bottomAction}
        </View>
      </View>
    </SafeAreaView>
  );
}
