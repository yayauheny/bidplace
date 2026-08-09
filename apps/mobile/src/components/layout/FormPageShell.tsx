import type { ReactNode } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from './AppShell';
import { getFormPageGutter, isFormPageCompact } from './form-page-layout';

export function FormPageShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: getFormPageGutter(width),
          paddingBottom: designTokens.space.x20,
          paddingTop: designTokens.space.x10,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.productDetailMaxWidth,
            alignSelf: 'center',
            gap: designTokens.space.x6,
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
  sidebarFirstOnCompact = false,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarFirstOnCompact?: boolean;
}) {
  const { width } = useWindowDimensions();
  const compact = isFormPageCompact(width);
  const main = (
    <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x5 }}>
      {children}
    </View>
  );
  const aside = (
    <View
      style={{
        width: compact ? '100%' : 360,
        minWidth: 0,
        gap: designTokens.space.x5,
      }}
    >
      {sidebar}
    </View>
  );

  return (
    <View
      style={{
        flexDirection: compact ? 'column' : 'row',
        alignItems: 'flex-start',
        gap: compact ? designTokens.space.x5 : designTokens.space.x8,
      }}
    >
      {compact && sidebarFirstOnCompact ? aside : main}
      {compact && sidebarFirstOnCompact ? main : aside}
    </View>
  );
}
