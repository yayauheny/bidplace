import { type Href, usePathname } from 'expo-router';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { AccountMenu } from './AccountMenu';
import { BrandLogo } from './BrandLogo';
import { CreateListingAction } from './CreateListingAction';
import { DiscoveryMenu } from './DiscoveryMenu';
import { HeaderNavigationLink } from './HeaderNavigationLink';
import { HeaderSearch } from './HeaderSearch';
import { MobileHeader } from './MobileHeader';
import {
  canShowDesktopCreateListing,
  getDiscoveryLabel,
  getHeaderSearchPlaceholder,
  isAuthorsRoute,
} from './header-chrome';
import {
  desktopActionsRowStyle,
  desktopBrandRowStyle,
  headerInnerLayoutStyle,
  headerOuterStyle,
  webMatteHeaderStyle,
} from './header-layout';

function isActiveRoute(pathname: string, href: Href) {
  if (href === '/') return pathname === '/';
  const value = String(href);
  return pathname === value || pathname.startsWith(`${value}/`);
}

export function AppHeader({ ambient = false }: { ambient?: boolean }) {
  const auth = useAuth();
  const capability = useSellerCapability();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  if (width < designTokens.breakpoint.mobileHeader) {
    return <MobileHeader ambient={ambient} />;
  }
  const desktop = width >= designTokens.breakpoint.compactHeader;
  const searchInline = width >= designTokens.breakpoint.headerSearchInline;
  const canCreate = canShowDesktopCreateListing({
    isAdmin: auth.isAdmin,
    sellerStatus: capability.status,
  });
  const authorsRoute = isAuthorsRoute(pathname);
  const discoveryLabel = getDiscoveryLabel(pathname);
  const searchPlaceholder = getHeaderSearchPlaceholder(pathname);
  const matteHeaderStyle =
    ambient && Platform.OS === 'web' ? webMatteHeaderStyle : undefined;

  const primaryNavigation = (
    <>
      <DiscoveryMenu desktop={desktop} label={discoveryLabel} />
      <HeaderNavigationLink
        active={isActiveRoute(pathname, authorsRoute ? '/works' : '/authors')}
        desktop={desktop}
        item={
          authorsRoute
            ? { label: 'Работы', href: '/works' }
            : { label: 'Авторы', href: '/authors' }
        }
      />
    </>
  );

  return (
    <View
      style={[headerOuterStyle(ambient), matteHeaderStyle]}
    >
      <View
        style={headerInnerLayoutStyle({ desktop, searchInline })}
      >
        {desktop && searchInline ? (
          <View style={desktopBrandRowStyle()}>
            <BrandLogo />
            <View
              accessibilityLabel="Основная навигация"
              role="navigation"
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginLeft: designTokens.space.x8,
              }}
            >
              {primaryNavigation}
            </View>
          </View>
        ) : (
          <>
            <BrandLogo />
            {desktop ? (
              <View
                accessibilityLabel="Основная навигация"
                role="navigation"
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                {primaryNavigation}
              </View>
            ) : null}
          </>
        )}
        {searchInline ? (
          <HeaderSearch inline placeholder={searchPlaceholder} />
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {desktop && searchInline ? (
          <View style={desktopActionsRowStyle()}>
            {canCreate ? (
              <CreateListingAction
                isAdmin={auth.isAdmin}
                sellerStatus={capability.status}
              />
            ) : null}
            <AccountMenu desktop={desktop} />
          </View>
        ) : (
          <>
            {canCreate ? (
              <CreateListingAction
                isAdmin={auth.isAdmin}
                sellerStatus={capability.status}
              />
            ) : null}
            <AccountMenu desktop={desktop} />
          </>
        )}
      </View>
      {!searchInline ? (
        <View
          style={{
            paddingHorizontal: desktop
              ? designTokens.space.x8
              : designTokens.layout.mobileGutter,
            paddingBottom: designTokens.space.x3,
          }}
        >
          <HeaderSearch inline={false} placeholder={searchPlaceholder} />
        </View>
      ) : null}
      {!desktop ? (
        <View accessibilityLabel="Основная навигация" role="navigation">
          <ScrollView
            horizontal
            contentContainerStyle={{
              gap: designTokens.space.x2,
              paddingHorizontal: designTokens.layout.mobileGutter,
              paddingBottom: designTokens.space.x3,
            }}
            showsHorizontalScrollIndicator={false}
          >
            {primaryNavigation}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
