import {
  Link,
  useLocalSearchParams,
  usePathname,
  useRouter,
  type Href,
} from 'expo-router';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Platform, TextInput, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { AppIcon, AppText, MotionPressable } from '../ui';
import { OverlayPortal } from './OverlayHost';
import { BrandLogo } from './BrandLogo';

const mobileHeaderBackground = designTokens.color.glass;
const mobileActionSize = designTokens.size.touch;
const mobileActionRadius = mobileActionSize / 2;
const mobileHeaderHeight = designTokens.size.mobileHeader;
type MobileHeaderAnchor = {
  getBoundingClientRect: () => DOMRect;
  focus?: () => void;
};

function MobileSearchTrigger({ onPress }: { onPress: () => void }) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel="Поиск"
      onPress={onPress}
      preset="icon"
      style={{
        width: mobileActionSize,
        height: mobileActionSize,
        minWidth: mobileActionSize,
        minHeight: mobileActionSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: mobileActionRadius,
        borderWidth: 1,
        borderColor: '#0000000A',
        backgroundColor: designTokens.color.headerControl,
      }}
    >
      <AppIcon name="search" size={20} />
    </MotionPressable>
  );
}

function MobileCreateTrigger({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel="Создать"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      preset="primaryAction"
      style={{
        width: mobileActionSize,
        height: mobileActionSize,
        minWidth: mobileActionSize,
        minHeight: mobileActionSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: mobileActionRadius,
        backgroundColor: designTokens.color.action,
      }}
    >
      <AppIcon name="plus" size={20} color={designTokens.color.surface} />
    </MotionPressable>
  );
}

function MobileMenuTrigger({
  onPress,
  open,
  triggerRef,
}: {
  onPress: () => void;
  open: boolean;
  triggerRef: MutableRefObject<MobileHeaderAnchor>;
}) {
  return (
    <MotionPressable
      ref={(node) => {
        triggerRef.current = node as unknown as MobileHeaderAnchor;
      }}
      nativeID="mobile-menu-trigger"
      accessibilityRole="button"
      accessibilityLabel="Меню"
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      preset="icon"
      style={{
        width: mobileActionSize,
        height: mobileActionSize,
        minWidth: mobileActionSize,
        minHeight: mobileActionSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: mobileActionRadius,
        borderWidth: 1,
        borderColor: '#0000000A',
        backgroundColor: designTokens.color.headerControl,
      }}
    >
      <AppIcon name="menu" size={20} />
    </MotionPressable>
  );
}

function MobileSearchOpen({
  value,
  onChangeText,
  onBack,
  onSubmit,
  inputRef,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  inputRef: MutableRefObject<TextInput>;
  placeholder: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel="Закрыть поиск"
        onPress={onBack}
        preset="icon"
        style={{
          width: mobileActionSize,
          height: mobileActionSize,
          minWidth: mobileActionSize,
          minHeight: mobileActionSize,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: mobileActionRadius,
        }}
      >
        <AppIcon name="arrowLeft" size={20} />
      </MotionPressable>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          height: designTokens.size.input,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: designTokens.size.input / 2,
          borderWidth: 1,
          borderColor: '#14141209',
          backgroundColor: designTokens.color.headerControl,
          paddingHorizontal: designTokens.space.x4 + 2,
        }}
      >
        <AppIcon
          name="search"
          size={20}
          color={designTokens.color.textSecondary}
        />
        <TextInput
          ref={(node) => {
            inputRef.current = node as TextInput;
          }}
          accessibilityLabel="Найти предмет или автора"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={designTokens.color.textMuted}
          returnKeyType="search"
          style={{
            flex: 1,
            minWidth: 0,
            color: designTokens.color.ink,
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
          }}
        />
      </View>
    </View>
  );
}

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
  href?: string;
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
        minHeight: 50,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 16,
        paddingHorizontal: designTokens.space.x4,
        backgroundColor: selected ? '#F5F5F1' : 'transparent',
      }}
      interactionStyle={({ hovered, pressed }) => ({
        backgroundColor:
          selected || hovered || pressed ? '#F5F5F1' : 'transparent',
      })}
    >
      <AppIcon name={icon} size={19} color={selected ? '#242422' : '#252523'} />
      <AppText role="label" style={{ flex: 1 }}>
        {label}
      </AppText>
    </MotionPressable>
  );

  return href ? (
    <Link href={href as Href} asChild>
      {content}
    </Link>
  ) : (
    content
  );
}

function MobileNavigationMenu({
  onClose,
  firstItemRef,
}: {
  onClose: () => void;
  firstItemRef: MutableRefObject<View>;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const isAuthors = pathname === '/authors' || pathname.startsWith('/authors/');

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await auth.logout();
      router.replace('/');
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
        width: designTokens.layout.mobileMenuWidth,
        gap: 4,
        borderRadius: designTokens.radius.button,
        borderWidth: 1,
        borderColor: '#1414140D',
        backgroundColor: designTokens.color.surface,
        padding: 10,
        ...designTokens.elevation.floating,
      }}
    >
      <MobileMenuItem
        icon="catalog"
        label="Аукционы"
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
        style={{ height: 1, backgroundColor: '#14141412', marginVertical: 2 }}
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

export function MobileHeader({ ambient = false }: { ambient?: boolean }) {
  const auth = useAuth();
  const capability = useSellerCapability();
  const router = useRouter();
  const pathname = usePathname();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState(typeof q === 'string' ? q : '');
  const menuTriggerRef = useRef<MobileHeaderAnchor>(null!);
  const menuFirstItemRef = useRef<View>(null!);
  const searchInputRef = useRef<TextInput>(null!);

  useEffect(() => {
    setQuery(typeof q === 'string' ? q : '');
  }, [q]);

  useEffect(() => {
    if ((!searchOpen && !menuOpen) || Platform.OS !== 'web') return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (searchOpen) {
        setSearchOpen(false);
        queueMicrotask(() => menuTriggerRef.current?.focus?.());
      } else {
        setMenuOpen(false);
        queueMicrotask(() => menuTriggerRef.current?.focus?.());
      }
    };
    const closeOnPointerDown = (event: PointerEvent) => {
      const trigger = document.getElementById('mobile-menu-trigger');
      const panel = document.getElementById('mobile-menu-panel');
      if (
        menuOpen &&
        event.target instanceof Node &&
        !trigger?.contains(event.target) &&
        !panel?.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnPointerDown);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnPointerDown);
    };
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      queueMicrotask(() => searchInputRef.current?.focus());
    }
    if (menuOpen) {
      queueMicrotask(() => menuFirstItemRef.current?.focus?.());
    }
  }, [menuOpen, searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    queueMicrotask(() => menuTriggerRef.current?.focus?.());
  };

  const submitSearch = () => {
    const value = query.trim();
    if (!value) return;
    router.push({ pathname: '/search', params: { q: value } });
    setSearchOpen(false);
  };

  const openCreate = () => {
    const returnDestination = pathname || '/';
    if (!auth.isAuthenticated) {
      router.push({
        pathname: '/login',
        params: { redirectTo: returnDestination },
      });
      return;
    }
    router.push(
      capability.status === 'APPROVED' ? '/products/new' : '/profile',
    );
  };

  const searchPlaceholder =
    pathname === '/works' ||
    pathname.startsWith('/works/') ||
    pathname === '/authors' ||
    pathname.startsWith('/authors/')
      ? 'Найти работу или автора'
      : 'Найти предмет или автора';

  return (
    <View
      style={{
        zIndex: designTokens.layer.chrome,
        flexShrink: 0,
        minHeight: mobileHeaderHeight,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.color.border,
        backgroundColor: ambient
          ? mobileHeaderBackground
          : designTokens.color.surface,
      }}
    >
      <View
        style={{
          width: '100%',
          height: mobileHeaderHeight,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: designTokens.space.x4,
        }}
      >
        {searchOpen ? (
          <MobileSearchOpen
            value={query}
            onChangeText={setQuery}
            onBack={closeSearch}
            onSubmit={submitSearch}
            inputRef={searchInputRef}
            placeholder={searchPlaceholder}
          />
        ) : (
          <>
            <BrandLogo />
            <View style={{ flex: 1 }} />
            <MobileSearchTrigger
              onPress={() => {
                setMenuOpen(false);
                setSearchOpen(true);
              }}
            />
            {!auth.isAdmin ? (
              <MobileCreateTrigger onPress={openCreate} />
            ) : null}
            <MobileMenuTrigger
              triggerRef={menuTriggerRef}
              open={menuOpen}
              onPress={() => {
                setSearchOpen(false);
                setMenuOpen((current) => !current);
              }}
            />
          </>
        )}
      </View>
      {menuOpen ? (
        Platform.OS === 'web' ? (
          <OverlayPortal
            anchorRef={menuTriggerRef}
            placement="bottom-end"
            width={designTokens.layout.mobileMenuWidth}
          >
            <MobileNavigationMenu
              onClose={() => setMenuOpen(false)}
              firstItemRef={menuFirstItemRef}
            />
          </OverlayPortal>
        ) : (
          <View
            style={{
              position: 'absolute',
              top: mobileHeaderHeight + designTokens.space.x2,
              right: designTokens.space.x4,
            }}
          >
            <MobileNavigationMenu
              onClose={() => setMenuOpen(false)}
              firstItemRef={menuFirstItemRef}
            />
          </View>
        )
      ) : null}
    </View>
  );
}
