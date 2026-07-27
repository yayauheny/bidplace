import { Link, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { modernTokens } from '@bidplace/design-tokens';
import {
  AppIcon,
  AppText,
  IconButton,
  MotionPressable,
  SecondaryButton,
} from '../modern-ui';
import { useAuth } from '../../providers/auth-provider';
import { BrandLogo } from './BrandLogo';
type Href = '/' | '/me/activity' | '/profile' | '/admin' | '/login';
type Item = { label: string; href: Href; icon: 'menu' | 'user' };
function items(auth: ReturnType<typeof useAuth>): Item[] {
  if (auth.isAdmin)
    return [
      { label: 'Каталог', href: '/', icon: 'menu' },
      { label: 'Модерация', href: '/admin', icon: 'user' },
    ];
  if (auth.canCreateListing)
    return [
      { label: 'Каталог', href: '/', icon: 'menu' },
      { label: 'Покупки', href: '/me/activity', icon: 'user' },
      { label: 'Продавец', href: '/profile', icon: 'user' },
    ];
  return auth.isAuthenticated
    ? [
        { label: 'Каталог', href: '/', icon: 'menu' },
        { label: 'Покупки', href: '/me/activity', icon: 'user' },
      ]
    : [
        { label: 'Каталог', href: '/', icon: 'menu' },
        { label: 'Войти', href: '/login', icon: 'user' },
      ];
}
export function AppHeader({
  mode = 'public',
}: {
  mode?: 'public' | 'seller' | 'admin' | 'auth';
}) {
  void mode;
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const desktop = width >= 1025;
  const [loggingOut, setLoggingOut] = useState(false);
  const nav = items(auth);
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await auth.logout();
    } finally {
      router.replace('/');
      setLoggingOut(false);
    }
  };
  const links = (
    <>
      {nav.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} asChild>
            <MotionPressable
              accessibilityRole="link"
              accessibilityLabel={item.label}
              preset="button"
              style={{
                minHeight: modernTokens.size.touch,
                flexDirection: desktop ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: modernTokens.space.x1,
                borderRadius: modernTokens.radius.pill,
                backgroundColor: active
                  ? modernTokens.color.ink
                  : 'transparent',
                paddingHorizontal: desktop
                  ? modernTokens.space.x3
                  : modernTokens.space.x2,
              }}
            >
              <AppIcon
                name={item.icon}
                color={
                  active ? modernTokens.color.surface : modernTokens.color.ink
                }
              />
              <AppText
                role="caption"
                style={{
                  color: active
                    ? modernTokens.color.surface
                    : modernTokens.color.ink,
                }}
              >
                {item.label}
              </AppText>
            </MotionPressable>
          </Link>
        );
      })}
    </>
  );
  return desktop ? (
    <View
      style={{
        width: 236,
        borderRightWidth: 1,
        borderRightColor: modernTokens.color.border,
        backgroundColor: modernTokens.color.surface,
        padding: modernTokens.space.x5,
        gap: modernTokens.space.x6,
      }}
    >
      <BrandLogo /> <View style={{ gap: modernTokens.space.x2 }}>{links}</View>
      {auth.isAuthenticated ? (
        <SecondaryButton label="Выйти" loading={loggingOut} onPress={logout} />
      ) : null}
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
        {auth.isAuthenticated ? (
          <IconButton
            icon="logOut"
            label="Выйти"
            onPress={logout}
            disabled={loggingOut}
          />
        ) : null}
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
