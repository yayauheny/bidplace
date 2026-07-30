import { Link, usePathname } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import type { ReactNode } from 'react';

import { modernTokens } from '@bidplace/design-tokens';

import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { AppIcon, AppText, MotionPressable } from '../modern-ui';
import { BrandLogo } from './BrandLogo';

type Href = '/' | '/me/activity' | '/profile' | '/admin' | '/products/new';
type Item = { label: string; href: Href; icon: 'catalog' | 'purchases' | 'seller' | 'moderation' | 'plus' };

function items(
  auth: ReturnType<typeof useAuth>,
  capability: ReturnType<typeof useSellerCapability>,
): Item[] {
  if (auth.isAdmin) {
    return [
      { label: 'Каталог', href: '/', icon: 'catalog' },
      { label: 'Модерация', href: '/admin', icon: 'moderation' },
    ];
  }
  if (!auth.isAuthenticated) {
    return [{ label: 'Каталог', href: '/', icon: 'catalog' }];
  }
  if (capability.status === 'APPROVED') {
    return [
      { label: 'Каталог', href: '/', icon: 'catalog' },
      { label: 'Покупки', href: '/me/activity', icon: 'purchases' },
      { label: 'Кабинет продавца', href: '/profile', icon: 'seller' },
      { label: 'Добавить предмет', href: '/products/new', icon: 'plus' },
    ];
  }
  return [
    { label: 'Каталог', href: '/', icon: 'catalog' },
    { label: 'Покупки', href: '/me/activity', icon: 'purchases' },
    {
      label: capability.profile ? 'Заявка продавца' : 'Стать продавцом',
      href: '/profile',
      icon: 'seller',
    },
  ];
}

function NavigationItem({
  item,
  active,
  desktop,
}: {
  item: Item;
  active: boolean;
  desktop: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const visibleLabel = hovered || focused;

  return (
    <View style={{ position: 'relative' }}>
      <Link href={item.href} asChild>
        <MotionPressable
          accessibilityRole="link"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: active }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          preset="button"
          style={{
            width: desktop ? modernTokens.size.touch : undefined,
            minHeight: modernTokens.size.touch,
            flexDirection: desktop ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: modernTokens.space.x1,
            borderRadius: modernTokens.radius.control,
            backgroundColor: active
              ? modernTokens.color.chip
              : hovered || focused
                ? modernTokens.color.surfaceMuted
                : 'transparent',
            paddingHorizontal: modernTokens.space.x2,
          }}
        >
          <AppIcon name={item.icon} color={modernTokens.color.ink} />
          {!desktop ? <AppText role="caption">{item.label}</AppText> : null}
        </MotionPressable>
      </Link>
      {desktop && visibleLabel ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: modernTokens.size.touch + modernTokens.space.x2,
            top: modernTokens.space.x1,
            minHeight: modernTokens.size.touch - modernTokens.space.x2,
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: modernTokens.color.border,
            borderRadius: modernTokens.radius.small,
            backgroundColor: modernTokens.color.surface,
            paddingHorizontal: modernTokens.space.x2,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            zIndex: modernTokens.layer.popover,
          }}
        >
          <AppText role="caption">{item.label}</AppText>
        </View>
      ) : null}
    </View>
  );
}

export function AppHeader({ accountControl }: { accountControl?: ReactNode }) {
  const auth = useAuth();
  const capability = useSellerCapability();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const desktop = width >= 1025;
  const nav = items(auth, capability);

  const links = nav.map((item) => {
    const active =
      (item.href === '/' &&
        (pathname === '/' || pathname.startsWith('/product/'))) ||
      (item.href !== '/' &&
        (pathname === item.href || pathname.startsWith(item.href)));
    return (
      <NavigationItem
        key={item.href}
        item={item}
        active={active}
        desktop={desktop}
      />
    );
  });

  return desktop ? (
    <View
      style={{
        width: 72,
        alignSelf: 'stretch',
        flexShrink: 0,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: modernTokens.color.border,
        backgroundColor: modernTokens.color.surface,
        paddingVertical: modernTokens.space.x4,
        gap: modernTokens.space.x8,
      }}
    >
      <BrandLogo compact />
      <View style={{ alignItems: 'center', gap: modernTokens.space.x2 }}>
        {links}
      </View>
    </View>
  ) : (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: modernTokens.color.border,
        backgroundColor: modernTokens.color.surface,
      }}
    >
      <View
        style={{
          minHeight: 56,
          paddingHorizontal: modernTokens.space.x5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <BrandLogo compact />
        {accountControl}
      </View>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          borderTopWidth: 1,
          borderTopColor: modernTokens.color.border,
          paddingVertical: modernTokens.space.x1,
        }}
      >
        {links}
      </View>
    </View>
  );
}
