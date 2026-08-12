import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { AppHeader } from './AppHeader';
import { OverlayHost } from './OverlayHost';
import { AmbientImageBackground } from '../ui/AmbientImageBackground';

export function AppShell({
  children,
  bottomAction,
  ambientImageUrl,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  ambientImageUrl?: string;
}) {
  const hasAmbient = Boolean(ambientImageUrl);

  return (
    <OverlayHost>
      <SafeAreaView
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: hasAmbient
            ? designTokens.color.surfaceWarm
            : designTokens.color.canvas,
        }}
      >
        {hasAmbient ? (
          <AmbientImageBackground imageUrl={ambientImageUrl} />
        ) : null}
        <View
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
          }}
        >
          <AppHeader ambient={hasAmbient} />
          <View
            testID="app-shell-content"
            style={{
              flex: 1,
              minWidth: 0,
              backgroundColor: 'transparent',
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
