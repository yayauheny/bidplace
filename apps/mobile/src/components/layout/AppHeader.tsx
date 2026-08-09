import { Link, usePathname } from 'expo-router';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { AppText, MotionPressable } from '../modern-ui';
import { AccountMenu } from './AccountMenu';
import { BrandLogo } from './BrandLogo';

type Href = '/' | '/me/activity' | '/profile' | '/admin' | '/products/new';
type HeaderItem = { label: string; href: Href };

function navigationItems(
  auth: ReturnType<typeof useAuth>,
  capability: ReturnType<typeof useSellerCapability>,
): HeaderItem[] {
  if (auth.isAdmin) {
    return [
      { label: 'Работы', href: '/' },
      { label: 'Модерация', href: '/admin' },
    ];
  }

  if (!auth.isAuthenticated) {
    return [{ label: 'Работы', href: '/' }];
  }

  if (capability.status === 'APPROVED') {
    return [
      { label: 'Работы', href: '/' },
      { label: 'Покупки', href: '/me/activity' },
      { label: 'Кабинет', href: '/profile' },
    ];
  }

  return [
    { label: 'Работы', href: '/' },
    { label: 'Покупки', href: '/me/activity' },
    {
      label: capability.profile ? 'Заявка продавца' : 'Стать продавцом',
      href: '/profile',
    },
  ];
}

function isActiveRoute(pathname: string, href: Href) {
  if (href === '/') {
    return pathname === '/' || pathname.startsWith('/product/');
  }
  return pathname === href || pathname.startsWith(href);
}

function NavigationLink({
  active,
  desktop,
  item,
}: {
  active: boolean;
  desktop: boolean;
  item: HeaderItem;
}) {
  return (
    <Link href={item.href} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={item.label}
        aria-current={active ? 'page' : undefined}
        preset="button"
        style={{
          minHeight: desktop
            ? designTokens.size.touch
            : designTokens.size.control,
          justifyContent: 'center',
          borderBottomWidth: desktop && active ? 2 : 0,
          borderBottomColor: designTokens.color.ink,
          borderRadius: desktop ? 0 : designTokens.radius.pill,
          paddingHorizontal: desktop
            ? designTokens.space.x3
            : designTokens.space.x4,
        }}
        interactionStyle={({ hovered, pressed }) => ({
          backgroundColor:
            !desktop && active
              ? designTokens.color.surfaceStrong
              : hovered || pressed
                ? designTokens.color.surfaceMuted
                : 'transparent',
        })}
      >
        <AppText role="nav" numberOfLines={1}>
          {item.label}
        </AppText>
      </MotionPressable>
    </Link>
  );
}

function CreateListingAction() {
  return (
    <Link href="/products/new" asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel="Выставить работу"
        preset="primaryAction"
        style={{
          minHeight: designTokens.size.buttonCompact,
          justifyContent: 'center',
          borderRadius: designTokens.radius.pill,
          backgroundColor: designTokens.color.action,
          paddingHorizontal: designTokens.space.x5,
        }}
        interactionStyle={({ hovered, pressed }) => ({
          backgroundColor:
            hovered || pressed
              ? designTokens.color.actionHover
              : designTokens.color.action,
        })}
      >
        <AppText
          role="button"
          numberOfLines={1}
          style={{ color: designTokens.color.surface }}
        >
          Выставить работу
        </AppText>
      </MotionPressable>
    </Link>
  );
}

export function AppHeader() {
  const auth = useAuth();
  const capability = useSellerCapability();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const desktop = width >= designTokens.breakpoint.compactHeader;
  const items = navigationItems(auth, capability);
  const canCreate = !auth.isAdmin && capability.status === 'APPROVED';
  const links = items.map((item) => (
    <NavigationLink
      key={item.href}
      active={isActiveRoute(pathname, item.href)}
      desktop={desktop}
      item={item}
    />
  ));

  return (
    <View
      style={{
        zIndex: designTokens.layer.chrome,
        flexShrink: 0,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.color.border,
        backgroundColor: designTokens.color.surface,
      }}
    >
      <View
        style={{
          width: '100%',
          minHeight: desktop
            ? designTokens.size.header
            : designTokens.size.mobileHeader,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: desktop ? designTokens.space.x8 : designTokens.space.x3,
          paddingHorizontal: desktop
            ? designTokens.space.x6
            : designTokens.layout.mobileGutter,
        }}
      >
        <BrandLogo />
        {desktop ? (
          <View
            role="navigation"
            accessibilityLabel="Основная навигация"
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            {links}
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        {canCreate ? <CreateListingAction /> : null}
        <AccountMenu desktop={desktop} />
      </View>
      {!desktop ? (
        <ScrollView
          horizontal
          contentContainerStyle={{
            gap: designTokens.space.x2,
            paddingHorizontal: designTokens.layout.mobileGutter,
            paddingBottom: designTokens.space.x3,
          }}
          showsHorizontalScrollIndicator={false}
        >
          {links}
        </ScrollView>
      ) : null}
    </View>
  );
}
