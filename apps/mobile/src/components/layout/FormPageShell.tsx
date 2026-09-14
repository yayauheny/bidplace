import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from './AppShell';

export function FormPageShell({
  children,
  bottomAction,
  maxWidth,
  hideDock = false,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  maxWidth?: number;
  hideDock?: boolean;
}) {
  return (
    <AppShell hideDock={hideDock} bottomAction={bottomAction}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: designTokens.space.pageGutter,
          paddingBottom: hideDock
            ? designTokens.space.x8
            : designTokens.size.dockReserve,
          paddingTop: designTokens.space.x6,
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
