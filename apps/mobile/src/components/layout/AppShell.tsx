import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { AppHeader } from './AppHeader';
import { OverlayHost } from './OverlayHost';
import {
  AmbientImageBackground,
  AppText,
  SecondaryButton,
  type AmbientBackgroundVariant,
} from '../ui';
import { useAuth } from '../../providers/auth-provider';

export function AppShell({
  children,
  bottomAction,
  ambientVariant,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  ambientVariant?: AmbientBackgroundVariant;
}) {
  const hasAmbient = ambientVariant !== undefined;
  const auth = useAuth();

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
        {ambientVariant ? (
          <AmbientImageBackground variant={ambientVariant} />
        ) : null}
        <View
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
          }}
        >
          <AppHeader ambient={hasAmbient} />
          {auth.status === 'error' ? (
            <View
              accessibilityRole="alert"
              style={{
                minHeight: designTokens.size.touch,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: designTokens.space.x3,
                paddingHorizontal: designTokens.layout.mobileGutter,
                paddingVertical: designTokens.space.x2,
                backgroundColor: designTokens.color.surface,
                borderBottomWidth: 1,
                borderBottomColor: designTokens.color.border,
              }}
            >
              <AppText role="bodySmall" tone="danger">
                {auth.sessionError}
              </AppText>
              <SecondaryButton
                label="Повторить"
                onPress={() => void auth.refreshSession()}
              />
            </View>
          ) : null}
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
