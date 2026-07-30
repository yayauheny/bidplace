import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { modernTokens } from '@bidplace/design-tokens';

import { AppHeader } from './AppHeader';
import { AccountMenu } from './AccountMenu';
import { OverlayHost } from './OverlayHost';

export function AppShell({
  children,
  bottomAction,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1025;

  return (
    <OverlayHost>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: modernTokens.color.canvas }}
      >
      <View
        style={{
          flex: 1,
          flexDirection: desktop ? 'row' : 'column',
        }}
      >
        <AppHeader
          accountControl={desktop ? undefined : <AccountMenu desktop={false} />}
        />
        <View style={{ flex: 1, minWidth: 0, backgroundColor: modernTokens.color.canvas }}>
          <View
            style={{
              minHeight: 56,
              alignItems: 'flex-end',
              justifyContent: 'center',
              position: 'relative',
              borderBottomWidth: 1,
              borderBottomColor: modernTokens.color.border,
              backgroundColor: modernTokens.color.surface,
              paddingHorizontal: desktop ? modernTokens.space.x8 : modernTokens.space.x5,
            }}
          >
            {desktop ? <AccountMenu desktop /> : null}
          </View>
          {children}
          {bottomAction}
        </View>
      </View>
      </SafeAreaView>
    </OverlayHost>
  );
}
