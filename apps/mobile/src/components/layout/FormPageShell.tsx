import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { PageScrollView } from './PageScrollView';
import { AppShell } from './AppShell';
import {
  FormDragScrollContext,
  useFormDragScrollOwner,
} from './form-drag-scroll';
import { useDockInset } from './use-dock-inset';

export function FormPageShell({
  children,
  bottomAction,
  maxWidth,
  hideDock = false,
  variant = 'default',
  contentGap,
  footer = variant === 'account' || variant === 'settings',
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  maxWidth?: number;
  hideDock?: boolean;
  contentGap?: number;
  footer?: boolean;
  variant?:
    | 'default'
    | 'authorApplication'
    | 'creation'
    | 'account'
    | 'settings';
}) {
  const { reserve } = useDockInset();
  const dragScroll = useFormDragScrollOwner();
  const Scroller = footer ? PageScrollView : ScrollView;

  return (
    <FormDragScrollContext value={dragScroll.value}>
      <AppShell
        hideDock={hideDock}
        bottomAction={bottomAction}
        contentLayout={footer ? 'bleed' : 'column'}
      >
        <Scroller
          {...(!footer
            ? {
                ref: dragScroll.ref,
                onScroll: dragScroll.onScroll,
                onLayout: dragScroll.onLayout,
                onContentSizeChange: dragScroll.onContentSizeChange,
                scrollEventThrottle: 16,
              }
            : {})}
          {...(footer ? { reserveDock: !hideDock } : {})}
          testID="form-page"
          contentContainerStyle={{
            paddingBottom: bottomAction
              ? designTokens.space.x3
              : footer
                ? 0
                : hideDock
                  ? designTokens.space.x8
                  : reserve,
            paddingTop:
              variant === 'authorApplication' || variant === 'creation'
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
              gap:
                contentGap ??
                (variant === 'creation'
                  ? designTokens.space.x5
                  : designTokens.space.sectionGap),
            }}
          >
            {children}
          </View>
        </Scroller>
      </AppShell>
    </FormDragScrollContext>
  );
}

export function FormPageColumns({
  children,
  sidebar,
  sidebarFirstOnCompact = true,
  layout = 'stack',
}: {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarFirstOnCompact?: boolean;
  layout?: 'stack' | 'adaptive';
}) {
  const [width, setWidth] = useState(0);
  if (layout === 'adaptive')
    return (
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{
          flexDirection:
            width >=
            designTokens.layout.cardWidth * 2 + designTokens.space.sectionGap
              ? 'row'
              : 'column',
          gap: designTokens.space.sectionGap,
          alignItems: 'stretch',
        }}
      >
        <View key="sidebar" style={{ flex: 1, minWidth: 0 }}>
          {sidebarFirstOnCompact ? sidebar : children}
        </View>
        <View key="content" style={{ flex: 1, minWidth: 0 }}>
          {sidebarFirstOnCompact ? children : sidebar}
        </View>
      </View>
    );
  return (
    <View style={{ gap: designTokens.space.sectionGap }}>
      {sidebarFirstOnCompact ? sidebar : children}
      {sidebarFirstOnCompact ? children : sidebar}
    </View>
  );
}
