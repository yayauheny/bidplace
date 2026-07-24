import { Link, usePathname } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { fontFamilies, mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { useAuth } from '../../providers/auth-provider';

type DesktopNavigationProps = {
  mode?: 'public' | 'seller' | 'admin' | 'auth';
};

type NavigationHref = '/' | '/me/activity' | '/profile' | '/admin';

type NavigationItem = {
  label: string;
  href: NavigationHref;
};

// Only routes that are actually implemented and stable.
const publicNavItems = [
  { label: 'Каталог', href: '/' as const },
  { label: 'Мои покупки', href: '/me/activity' as const },
];

const sellerNavItems = [
  { label: 'Каталог', href: '/' as const },
  { label: 'Мои покупки', href: '/me/activity' as const },
  { label: 'Продавать', href: '/profile' as const },
];

const adminNavItems = [
  { label: 'Каталог', href: '/' as const },
  { label: 'Модерация', href: '/admin' as const },
];

function getNavItems(mode: DesktopNavigationProps['mode']) {
  if (mode === 'admin') return adminNavItems;
  if (mode === 'seller') return sellerNavItems;
  return publicNavItems;
}

export function DesktopNavigation({ mode = 'public' }: DesktopNavigationProps) {
  const pathname = usePathname();
  const palette = useAppThemePalette();
  const auth = useAuth();

  let navItems: NavigationItem[] = getNavItems(mode);
  if (auth.canModerate && !navItems.some((item) => item.href === '/admin')) {
    navItems = [...navItems, { label: 'Модерация', href: '/admin' }];
  }
  if (!auth.canModerate) {
    navItems = navItems.filter((item) => item.href !== '/admin');
  }

  return (
    <XStack style={{ alignItems: 'center', gap: mobileSpacing[5] }}>
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link key={`${item.label}-${item.href}`} href={item.href} asChild>
            <Pressable
              accessibilityRole="link"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <YStack style={{ paddingVertical: mobileSpacing[1] }}>
                <Text
                  style={{
                    fontFamily: fontFamilies.sansMedium,
                    fontSize: 13,
                    lineHeight: 18,
                    letterSpacing: 0.2,
                    color: active ? palette.color : palette.colorSecondary,
                    fontWeight: active ? '600' : '400',
                  }}
                >
                  {item.label}
                </Text>
                {/* Active indicator — bottom border, not underline */}
                {active ? (
                  <YStack
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: 0,
                      right: 0,
                      height: 1.5,
                      backgroundColor: palette.color,
                      borderRadius: 1,
                    }}
                  />
                ) : null}
              </YStack>
            </Pressable>
          </Link>
        );
      })}
    </XStack>
  );
}
