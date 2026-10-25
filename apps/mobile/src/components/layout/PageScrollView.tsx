import type { Ref } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { designTokens } from '@bidplace/design-tokens';
import { BrandLogo } from './BrandLogo';
import { usePageDesktopChrome, usePageDockVisible } from './public-navigation';
import { PageColumn } from './PageColumn';
import { SiteFooter } from './SiteFooter';
import { useDockInset } from './use-dock-inset';

// Desktop Home3139:2222: heading y140 below68px header,12px inner section inset.
const brandedPage = { wideTop: 72, wideGutter: 24 };

/** One full-width page scrollport; content and footer share the column owner. */
export function PageScrollView({
  children,
  contentContainerStyle,
  reserveDock = true,
  animated = false,
  variant = 'default',
  ...props
}: ScrollViewProps & {
  ref?: Ref<ScrollView>;
  reserveDock?: boolean;
  animated?: boolean;
  variant?: 'default' | 'branded';
}) {
  const desktop = usePageDesktopChrome();
  const dockVisible = usePageDockVisible();
  const { reserve } = useDockInset();
  const Scroller = animated ? Animated.ScrollView : ScrollView;
  return (
    <Scroller {...props} contentContainerStyle={{ flexGrow: 1 }}>
      <PageColumn
        testID="page-content-column"
        style={[
          { flexGrow: 1 },
          variant === 'branded' && {
            paddingTop: desktop
              ? brandedPage.wideTop
              : designTokens.space.logoTop,
          },
          variant === 'branded' &&
            desktop && { paddingHorizontal: brandedPage.wideGutter },
          contentContainerStyle,
        ]}
      >
        {variant === 'branded' && !desktop ? (
          <View
            style={{
              alignItems: 'center',
              marginBottom: designTokens.space.logoGap,
            }}
          >
            <BrandLogo />
          </View>
        ) : null}
        {children}
      </PageColumn>
      <SiteFooter />
      <View
        aria-hidden
        style={{ height: reserveDock && dockVisible ? reserve : 0 }}
      />
    </Scroller>
  );
}
