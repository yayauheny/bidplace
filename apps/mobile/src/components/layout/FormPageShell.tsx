import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from './AppShell';
import { useDockInset } from './use-dock-inset';

export function FormPageShell({
  children,
  bottomAction,
  maxWidth,
  hideDock = false,
  variant = 'default',
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  maxWidth?: number;
  hideDock?: boolean;
  variant?: 'default' | 'authorApplication' | 'account' | 'settings';
}) {
  const { reserve } = useDockInset();

  return (
    <AppShell hideDock={hideDock} bottomAction={bottomAction}>
      <ScrollView
        testID="form-page"
        contentContainerStyle={{
          paddingBottom: bottomAction
            ? 0
            : hideDock
              ? designTokens.space.x8
              : reserve,
          paddingTop:
            variant === 'authorApplication'
              ? designTokens.authorApplication.contentTop
              : variant === 'account'
                ? designTokens.space.x3
                : variant === 'settings'
                  ? designTokens.space.x5
                  : designTokens.space.x6,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth,
            alignSelf: maxWidth ? 'center' : undefined,
            gap: designTokens.space.sectionGap,
          }}
        >
          {children}
        </View>
      </ScrollView>
    </AppShell>
  );
}

export function FormPageColumns({
  children,
  sidebar,
  sidebarFirstOnCompact = true,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarFirstOnCompact?: boolean;
}) {
  return (
    <View style={{ gap: designTokens.space.sectionGap }}>
      {sidebarFirstOnCompact ? sidebar : children}
      {sidebarFirstOnCompact ? children : sidebar}
    </View>
  );
}
