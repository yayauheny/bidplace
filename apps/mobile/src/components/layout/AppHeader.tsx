import {
  Link,
  type Href,
  useLocalSearchParams,
  usePathname,
  useRouter,
} from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { AppIcon, AppText, MotionPressable } from '../ui';
import { AccountMenu } from './AccountMenu';
import { BrandLogo } from './BrandLogo';
import { MobileHeader } from './MobileHeader';
import { OverlayPortal } from './OverlayHost';

type HeaderItem = { label: string; href: Href };

function isActiveRoute(pathname: string, href: Href) {
  if (href === '/') return pathname === '/';
  const value = String(href);
  return pathname === value || pathname.startsWith(`${value}/`);
}

function NavigationLink({
  active,
  desktop,
  item,
  onPress,
}: {
  active: boolean;
  desktop: boolean;
  item: HeaderItem;
  onPress?: () => void;
}) {
  return (
    <Link href={item.href} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={item.label}
        aria-current={active ? 'page' : undefined}
        onPress={onPress}
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
          backgroundColor: desktop
            ? active
              ? designTokens.color.surfaceStrong
              : hovered || pressed
                ? designTokens.color.surfaceMuted
                : 'transparent'
            : active
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

function DiscoveryDropdown({
  desktop,
  label,
  onNavigate,
}: {
  desktop: boolean;
  label: 'Аукционы' | 'Авторы';
  onNavigate: () => void;
}) {
  const items: Array<HeaderItem & { icon: 'catalog' | 'user' }> = [
    {
      label: label === 'Авторы' ? 'Работы' : 'Аукционы',
      href: '/works',
      icon: 'catalog',
    },
    { label: 'Авторы', href: '/authors', icon: 'user' },
  ];

  return (
    <View
      accessibilityRole="menu"
      style={{
        position: desktop ? undefined : 'absolute',
        top: desktop ? undefined : designTokens.size.touch,
        left: desktop ? undefined : 0,
        width: designTokens.layout.discoveryMenuWidth,
        gap: designTokens.space.x1,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        borderRadius: designTokens.radius.menu,
        backgroundColor: designTokens.color.surface,
        padding: designTokens.space.x2,
        ...designTokens.elevation.floating,
      }}
    >
      {items.map((item) => (
        <Link key={item.label} href={item.href} asChild>
          <MotionPressable
            accessibilityRole="link"
            accessibilityLabel={item.label}
            onPress={onNavigate}
            preset="button"
            style={{
              minHeight: designTokens.size.touch,
              flexDirection: 'row',
              alignItems: 'center',
              gap: designTokens.space.x3,
              borderRadius: designTokens.radius.small,
              paddingHorizontal: designTokens.space.x3,
            }}
            interactionStyle={({ hovered, pressed }) => ({
              backgroundColor:
                hovered || pressed
                  ? designTokens.color.surfaceStrong
                  : 'transparent',
            })}
          >
            <AppIcon name={item.icon} size={18} />
            <AppText role="label">{item.label}</AppText>
          </MotionPressable>
        </Link>
      ))}
    </View>
  );
}

function DiscoveryMenu({
  desktop,
  label,
}: {
  desktop: boolean;
  label: 'Аукционы' | 'Авторы';
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<{
    getBoundingClientRect: () => DOMRect;
    focus?: () => void;
  } | null>(null);
  const active =
    pathname === '/works' ||
    pathname === '/authors' ||
    pathname === '/search' ||
    pathname.startsWith('/product/') ||
    pathname.startsWith('/seller/');

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus?.();
    };
    const closeOnPointerDown = (event: PointerEvent) => {
      const trigger = document.getElementById('discovery-menu-trigger');
      const dropdown = document.getElementById('discovery-menu-dropdown');
      if (
        event.target instanceof Node &&
        !trigger?.contains(event.target) &&
        !dropdown?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnPointerDown);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnPointerDown);
    };
  }, [open]);

  const dropdown = (
    <DiscoveryDropdown
      desktop={Platform.OS === 'web'}
      label={label}
      onNavigate={() => setOpen(false)}
    />
  );

  return (
    <View nativeID="discovery-menu-trigger" style={{ position: 'relative' }}>
      <MotionPressable
        ref={(node) => {
          triggerRef.current = node as unknown as {
            getBoundingClientRect: () => DOMRect;
            focus?: () => void;
          } | null;
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open, selected: active }}
        onAccessibilityEscape={() => {
          setOpen(false);
          triggerRef.current?.focus?.();
        }}
        onPress={() => setOpen((current) => !current)}
        style={{
          minHeight: desktop
            ? designTokens.size.touch
            : designTokens.size.control,
          width: desktop ? 142 : undefined,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: designTokens.space.x1,
          borderRadius: desktop ? 22 : designTokens.radius.pill,
          backgroundColor: desktop
            ? designTokens.color.surfaceStrong
            : 'transparent',
          paddingHorizontal: desktop
            ? designTokens.space.x3
            : designTokens.space.x4,
        }}
        interactionStyle={({ hovered, pressed }) => ({
          backgroundColor: active
            ? designTokens.color.surfaceStrong
            : hovered || pressed
              ? designTokens.color.surfaceMuted
              : 'transparent',
        })}
      >
        <AppText role="nav">{label}</AppText>
        <View
          style={{
            transform: [{ rotate: open ? '180deg' : '0deg' }],
          }}
        >
          <AppIcon name="chevronDown" size={16} />
        </View>
      </MotionPressable>
      {open ? (
        Platform.OS === 'web' ? (
          <OverlayPortal
            anchorRef={triggerRef}
            placement="bottom-start"
            testId="discovery-menu-dropdown"
            width={designTokens.layout.discoveryMenuWidth}
          >
            {dropdown}
          </OverlayPortal>
        ) : (
          dropdown
        )
      ) : null}
    </View>
  );
}

function HeaderSearch({
  inline,
  placeholder,
}: {
  inline: boolean;
  placeholder: string;
}) {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery(typeof q === 'string' ? q : '');
  }, [q]);

  const submit = () => {
    const value = query.trim();
    if (!value) return;
    router.push({ pathname: '/search', params: { q: value } });
  };

  return (
    <View
      style={{
        width: inline ? '100%' : undefined,
        maxWidth: inline ? 480 : undefined,
        flex: inline ? 1 : undefined,
        flexDirection: 'row',
        alignItems: 'center',
        gap: designTokens.space.x3,
        minHeight: designTokens.size.input,
        borderRadius: designTokens.radius.pill,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        backgroundColor: designTokens.color.surfaceStrong,
        paddingHorizontal: 18,
      }}
    >
      <AppIcon
        name="search"
        size={18}
        color={designTokens.color.textSecondary}
      />
      <TextInput
        accessibilityLabel="Найти предмет или автора"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={submit}
        returnKeyType="search"
        placeholder={placeholder}
        placeholderTextColor={designTokens.color.textMuted}
        style={{
          flex: 1,
          minWidth: 0,
          color: designTokens.color.ink,
          fontFamily: 'Inter_500Medium',
          fontSize: 15,
        }}
      />
    </View>
  );
}

function CreateListingAction() {
  return (
    <Link href="/products/new" asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel="Добавить работу"
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
          Создать
        </AppText>
      </MotionPressable>
    </Link>
  );
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
  const canCreate = !auth.isAdmin && capability.status === 'APPROVED';
  const authorsRoute =
    pathname === '/authors' || pathname.startsWith('/authors/');
  const discoveryLabel = authorsRoute ? 'Авторы' : 'Аукционы';
  const searchPlaceholder =
    pathname === '/works' || pathname.startsWith('/works/') || authorsRoute
      ? 'Найти работу или автора'
      : 'Найти предмет или автора';

  const primaryNavigation = (
    <>
      <DiscoveryMenu desktop={desktop} label={discoveryLabel} />
      <NavigationLink
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
      style={{
        zIndex: designTokens.layer.chrome,
        flexShrink: 0,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.color.border,
        backgroundColor: ambient
          ? designTokens.color.glass
          : designTokens.color.surface,
      }}
    >
      <View
        style={{
          width: '100%',
          minHeight: desktop
            ? designTokens.size.header
            : designTokens.size.mobileHeader,
          flexDirection: 'row',
          alignItems: 'center',
          gap:
            desktop && searchInline
              ? designTokens.space.x7
              : desktop
                ? designTokens.space.x6
                : designTokens.space.x3,
          paddingHorizontal: desktop
            ? designTokens.space.x8
            : designTokens.layout.mobileGutter,
        }}
      >
        {desktop && searchInline ? (
          <View
            style={{
              width: 420,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
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
          <View
            style={{
              width: 420,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: designTokens.space.x3,
            }}
          >
            {canCreate ? <CreateListingAction /> : null}
            <AccountMenu desktop={desktop} />
          </View>
        ) : (
          <>
            {canCreate ? <CreateListingAction /> : null}
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
