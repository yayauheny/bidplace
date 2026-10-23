import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { PageScrollView } from './PageScrollView';
import { AppShell } from './AppShell';
import { useDockInset } from './use-dock-inset';

export function FormPageShell({
  children,
  bottomAction,
  maxWidth,
  hideDock = false,
  variant = 'default',
  footer = variant === 'account' || variant === 'settings',
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  maxWidth?: number;
  hideDock?: boolean;
  footer?: boolean;
  variant?: 'default' | 'authorApplication' | 'creation' | 'account' | 'settings';
}) {
  const { reserve } = useDockInset();
  const Scroller = footer ? PageScrollView : ScrollView;

  return (
    <AppShell
      hideDock={hideDock}
      bottomAction={bottomAction}
      contentLayout={footer ? 'bleed' : 'column'}
    >
      <Scroller
        {...(footer ? { reserveDock: !hideDock } : {})}
        testID="form-page"
        contentContainerStyle={{
          paddingBottom:
            footer || bottomAction
              ? 0
              : hideDock
                ? designTokens.space.x8
                : reserve,
          paddingTop:
            (variant === 'authorApplication' || variant === 'creation')
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
            gap: variant === 'creation' ? designTokens.space.x5 : designTokens.space.sectionGap,
          }}
        >
          {children}
        </View>
      </Scroller>
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
