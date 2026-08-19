import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, TextInput, View, useWindowDimensions } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import {
  MobileCreateTrigger,
  MobileMenuTrigger,
  MobileSearchOpen,
  MobileSearchTrigger,
} from './MobileHeaderActions';
import { MobileNavigationMenu } from './MobileNavigationMenu';
import { OverlayPortal } from './OverlayHost';
import { BrandLogo } from './BrandLogo';
import { type FocusableAnchor } from './focusable-anchor';
import {
  getHeaderSearchPlaceholder,
  getMobileCreateHref,
  submitHeaderSearch,
} from './header-chrome';
import {
  mobileHeaderBackground,
  mobileHeaderHeight,
  mobileHeaderHorizontalGap,
} from './mobile-header-layout';
import { getMobileMenuWidth } from './mobile-menu-layout';
import { useDismissibleOverlay } from './use-dismissible-overlay';

export function MobileHeader({ ambient = false }: { ambient?: boolean }) {
  const auth = useAuth();
  const capability = useSellerCapability();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState(typeof q === 'string' ? q : '');
  const menuTriggerRef = useRef<FocusableAnchor | null>(null);
  const menuFirstItemRef = useRef<View>(null!);
  const searchInputRef = useRef<TextInput>(null!);
  const menuWidth = getMobileMenuWidth(width);

  useEffect(() => {
    setQuery(typeof q === 'string' ? q : '');
  }, [q]);

  useDismissibleOverlay({
    open: searchOpen || menuOpen,
    onClose: (reason) => {
      if (reason === 'pointerdown' || reason === 'focusin') {
        if (menuOpen) setMenuOpen(false);
        return;
      }

      if (searchOpen) {
        setSearchOpen(false);
        return;
      }

      setMenuOpen(false);
    },
    restoreFocus: () =>
      queueMicrotask(() => menuTriggerRef.current?.focus?.()),
    getSurfaces: () => [
      document.getElementById('mobile-menu-trigger'),
      document.getElementById('mobile-menu-panel'),
    ],
  });

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
    submitHeaderSearch(router, value);
    setSearchOpen(false);
  };

  const openCreate = () => {
    const returnDestination = pathname || '/';
    router.push(
      getMobileCreateHref({
        isAuthenticated: auth.isAuthenticated,
        sellerStatus: capability.status,
        returnPath: returnDestination,
      }),
    );
  };

  const searchPlaceholder = getHeaderSearchPlaceholder(pathname);

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
          gap: mobileHeaderHorizontalGap,
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
            width={menuWidth}
          >
            <MobileNavigationMenu
              onClose={() => setMenuOpen(false)}
              firstItemRef={menuFirstItemRef}
              menuWidth={menuWidth}
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
              menuWidth={menuWidth}
            />
          </View>
        )
      ) : null}
    </View>
  );
}
