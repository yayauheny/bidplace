import { useState, type MutableRefObject } from 'react';
import { Link, type Href, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '../../providers/auth-provider';
import { designTokens } from '@bidplace/design-tokens';

import { AppIcon, AppText, MotionPressable } from '../ui';
import { logoutAndGoHome } from './header-chrome';
import {
  mobileMenuIconDefaultColor,
  mobileMenuIconSelectedColor,
  mobileMenuItemBorderRadius,
  mobileMenuItemGap,
  mobileMenuItemMinHeight,
  mobileMenuItemSelectedBackgroundColor,
  mobileNavigationMenuBorderColor,
  mobileNavigationMenuGap,
  mobileNavigationMenuPadding,
} from './mobile-header-layout';

function MobileMenuItem({
  icon,
  label,
  href,
  selected,
  onPress,
  itemRef,
}: {
  icon: 'catalog' | 'user' | 'account' | 'logOut';
  label: string;
  href?: Href;
  selected?: boolean;
  onPress?: () => void;
  itemRef?: MutableRefObject<View>;
}) {
  const content = (
    <MotionPressable
      ref={
        itemRef
          ? (node) => {
              itemRef.current = node as unknown as View;
            }
          : undefined
      }
      accessibilityRole={href ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      preset="button"
      style={{
        minHeight: mobileMenuItemMinHeight,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: mobileMenuItemGap,
        borderRadius: mobileMenuItemBorderRadius,
        paddingHorizontal: designTokens.space.x4,
        backgroundColor: selected
          ? mobileMenuItemSelectedBackgroundColor
          : 'transparent',
      }}
      interactionStyle={({ hovered, pressed }) => ({
        backgroundColor:
          selected || hovered || pressed
            ? mobileMenuItemSelectedBackgroundColor
            : 'transparent',
      })}
    >
      <AppIcon
        name={icon}
        size={19}
        color={selected ? mobileMenuIconSelectedColor : mobileMenuIconDefaultColor}
      />
      <AppText role="label" style={{ flex: 1 }}>
        {label}
      </AppText>
    </MotionPressable>
  );

  return href ? <Link href={href} asChild>{content}</Link> : content;
}

export function MobileNavigationMenu({
  onClose,
  firstItemRef,
  menuWidth,
}: {
  onClose: () => void;
  firstItemRef: MutableRefObject<View>;
  menuWidth: number;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const isAuthors =
    pathname === '/authors' || pathname.startsWith('/authors/');

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutAndGoHome(auth, router);
    } finally {
      setLoggingOut(false);
      onClose();
    }
  };

  return (
    <View
      nativeID="mobile-menu-panel"
      accessibilityRole="menu"
      style={{
        width: menuWidth,
        gap: mobileNavigationMenuGap,
        borderRadius: designTokens.radius.button,
        borderWidth: 1,
        borderColor: mobileNavigationMenuBorderColor,
        backgroundColor: designTokens.color.surface,
        padding: mobileNavigationMenuPadding,
        ...designTokens.elevation.floating,
      }}
    >
      <MobileMenuItem
        icon="catalog"
        label="Работы"
        href="/works"
        selected={!isAuthors}
        onPress={onClose}
        itemRef={firstItemRef}
      />
      <MobileMenuItem
        icon="user"
        label="Авторы"
        href="/authors"
        selected={isAuthors}
        onPress={onClose}
      />
      <View
        style={{
          height: 1,
          backgroundColor: '#14141412',
          marginVertical: 2,
        }}
      />
      {auth.isAuthenticated ? (
        <>
          <MobileMenuItem
            icon="account"
            label="Кабинет"
            href={auth.isAdmin ? '/admin' : '/profile'}
            onPress={onClose}
          />
          <View
            style={{
              height: 1,
              backgroundColor: '#14141412',
              marginVertical: 2,
            }}
          />
          <MobileMenuItem
            icon="logOut"
            label={loggingOut ? 'Выходим…' : 'Выйти'}
            onPress={() => void logout()}
          />
        </>
      ) : (
        <MobileMenuItem
          icon="account"
          label="Войти"
          href="/login"
          onPress={onClose}
        />
      )}
    </View>
  );
}
