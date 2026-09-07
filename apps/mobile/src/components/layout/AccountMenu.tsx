import { Link, usePathname, useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import {
  AppIcon,
  AppText,
  MotionPressable,
} from '../ui';
import { OverlayPortal } from './OverlayHost';
import {
  ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS,
  shouldDismissAccountMenuOnHoverLeave,
  subscribeAccountMenuSurfaceHover,
} from './account-menu-hover';
import {
  assignFocusableAnchorRef,
  type FocusableAnchor,
} from './focusable-anchor';
import { logoutAndGoHome } from './header-chrome';
import { overlayMenuItemStyle, overlayPanelStyle } from './overlay-layout';
import { useDismissibleOverlay } from './use-dismissible-overlay';

const menuItemStyle = overlayMenuItemStyle({
  minHeight: 48,
  borderRadius: 14,
  paddingHorizontal: designTokens.space.x3,
  gap: designTokens.space.x3,
});

const menuItemInteractionStyle = ({
  hovered,
  pressed,
}: {
  hovered: boolean;
  pressed: boolean;
}) => ({
  backgroundColor:
    hovered || pressed ? designTokens.color.surfaceStrong : 'transparent',
});

export function AccountMenu({ desktop = false }: { desktop?: boolean }) {
  const auth = useAuth();
  const capability = useSellerCapability();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const focusOpened = useRef(false);
  const suppressNextFocusOpen = useRef(false);
  const triggerHoveredRef = useRef(false);
  const dropdownHoveredRef = useRef(false);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstMenuItemRef = useRef<FocusableAnchor | null>(null);
  const triggerRef = useRef<FocusableAnchor | null>(null);
  const label = auth.user?.displayName?.trim() || auth.user?.email || 'Аккаунт';
  const profileLabel = auth.isAdmin
    ? null
    : capability.status === 'APPROVED'
      ? 'Кабинет'
      : capability.profile
        ? 'Заявка продавца'
        : 'Стать продавцом';
  const clearHoverCloseTimer = useCallback(() => {
    if (hoverCloseTimerRef.current === null) return;
    clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = null;
  }, []);

  const closeMenu = useCallback(
    (restoreFocus = false) => {
      clearHoverCloseTimer();
      triggerHoveredRef.current = false;
      dropdownHoveredRef.current = false;
      focusOpened.current = false;
      setOpen(false);
      if (restoreFocus) {
        suppressNextFocusOpen.current = true;
        triggerRef.current?.focus?.();
        queueMicrotask(() => {
          suppressNextFocusOpen.current = false;
        });
      }
    },
    [clearHoverCloseTimer],
  );

  const scheduleHoverClose = useCallback(() => {
    if (!desktop || Platform.OS !== 'web') return;

    clearHoverCloseTimer();
    hoverCloseTimerRef.current = setTimeout(() => {
      hoverCloseTimerRef.current = null;
      if (
        shouldDismissAccountMenuOnHoverLeave(
          triggerHoveredRef.current,
          dropdownHoveredRef.current,
        )
      ) {
        closeMenu();
      }
    }, ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS);
  }, [clearHoverCloseTimer, closeMenu, desktop]);

  const handleTriggerHoverIn = useCallback(() => {
    triggerHoveredRef.current = true;
    clearHoverCloseTimer();
    setOpen(true);
  }, [clearHoverCloseTimer]);

  const handleTriggerHoverOut = useCallback(() => {
    triggerHoveredRef.current = false;
    scheduleHoverClose();
  }, [scheduleHoverClose]);

  const handleDropdownHoverIn = useCallback(() => {
    dropdownHoveredRef.current = true;
    clearHoverCloseTimer();
  }, [clearHoverCloseTimer]);

  const handleDropdownHoverOut = useCallback(() => {
    dropdownHoveredRef.current = false;
    scheduleHoverClose();
  }, [scheduleHoverClose]);

  useLayoutEffect(() => {
    if (!open || !desktop || Platform.OS !== 'web') return;

    let unsubscribe: (() => void) | null = null;
    let frame: number | null = null;

    const bind = () => {
      const dropdown = document.getElementById('account-menu-dropdown');
      if (!dropdown) return null;
      return subscribeAccountMenuSurfaceHover(dropdown, {
        onEnter: handleDropdownHoverIn,
        onLeave: handleDropdownHoverOut,
      });
    };

    unsubscribe = bind();
    if (!unsubscribe) {
      frame = requestAnimationFrame(() => {
        unsubscribe = bind();
      });
    }

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      unsubscribe?.();
    };
  }, [desktop, handleDropdownHoverIn, handleDropdownHoverOut, open]);

  useEffect(() => () => clearHoverCloseTimer(), [clearHoverCloseTimer]);

  useEffect(() => {
    closeMenu();
  }, [closeMenu, pathname]);

  useDismissibleOverlay({
    open,
    onClose: (reason) => {
      if (reason === 'escape') closeMenu(true);
      else closeMenu();
    },
    getSurfaces: () => [
      document.getElementById('account-menu'),
      document.getElementById('account-menu-dropdown'),
    ],
    closeOnFocusIn: true,
  });

  useEffect(() => {
    if (!open || !focusOpened.current || Platform.OS !== 'web') return;

    queueMicrotask(() => firstMenuItemRef.current?.focus?.());
  }, [open]);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutAndGoHome(auth, router);
    } finally {
      setLoggingOut(false);
      closeMenu();
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <Link href="/login" asChild>
        <MotionPressable
          accessibilityRole="link"
          accessibilityLabel="Войти"
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
          <AppText role="button" style={{ color: designTokens.color.surface }}>
            Войти
          </AppText>
        </MotionPressable>
      </Link>
    );
  }

  return (
    <View nativeID="account-menu" style={{ position: 'relative' }}>
      <MotionPressable
        ref={(node) => assignFocusableAnchorRef(triggerRef, node)}
        accessibilityRole="button"
        accessibilityLabel={`Открыть меню аккаунта: ${label}`}
        accessibilityState={{ expanded: open }}
        onAccessibilityEscape={() => closeMenu(true)}
        onFocus={
          desktop
            ? () => {
                if (suppressNextFocusOpen.current) {
                  suppressNextFocusOpen.current = false;
                  return;
                }
                focusOpened.current = true;
                setOpen(true);
              }
            : undefined
        }
        onHoverIn={desktop ? handleTriggerHoverIn : undefined}
        onHoverOut={desktop ? handleTriggerHoverOut : undefined}
        onPress={() => {
          if (focusOpened.current) {
            focusOpened.current = false;
            return;
          }
          setOpen((current) => !current);
        }}
        style={({ hovered, pressed }) => ({
          width: 40,
          height: 40,
          minWidth: 40,
          minHeight: 40,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: designTokens.space.x1,
          borderRadius: designTokens.radius.pill,
          backgroundColor:
            hovered || pressed ? designTokens.color.chip : 'transparent',
          paddingHorizontal: 0,
        })}
      >
        <AppIcon name="account" size={20} />
      </MotionPressable>
      {open ? (
        Platform.OS === 'web' ? (
          <OverlayPortal
            anchorRef={triggerRef}
            testId="account-menu-dropdown"
            width={designTokens.layout.accountPopoverWidth}
          >
            <AccountDropdown
              profileLabel={profileLabel}
              showPurchases={false}
              showOrders={false}
              showModeration={auth.isAdmin}
              loggingOut={loggingOut}
              onLogout={() => void logout()}
              firstMenuItemRef={firstMenuItemRef}
              inline={false}
            />
          </OverlayPortal>
        ) : (
          <AccountDropdown
            profileLabel={profileLabel}
            showPurchases={false}
            showOrders={false}
            showModeration={auth.isAdmin}
            loggingOut={loggingOut}
            onLogout={() => void logout()}
            firstMenuItemRef={firstMenuItemRef}
            inline
          />
        )
      ) : null}
    </View>
  );
}

function AccountDropdown({
  profileLabel,
  showPurchases,
  showOrders,
  showModeration,
  loggingOut,
  onLogout,
  firstMenuItemRef,
  inline,
}: {
  profileLabel: string | null;
  showPurchases: boolean;
  showOrders: boolean;
  showModeration: boolean;
  loggingOut: boolean;
  onLogout: () => void;
  firstMenuItemRef: MutableRefObject<FocusableAnchor | null>;
  inline: boolean;
}) {
  return (
    <View
      style={overlayPanelStyle({
        position: inline ? 'absolute' : undefined,
        top: inline ? designTokens.size.touch : undefined,
        right: inline ? 0 : undefined,
        width: inline
          ? undefined
          : designTokens.layout.accountPopoverWidth,
        minWidth: inline
          ? designTokens.layout.accountPopoverWidth
          : undefined,
        gap: designTokens.space.x2,
        borderRadius: 22,
        borderColor: designTokens.color.border,
        padding: 10,
      })}
    >
      {profileLabel ? (
        <Link href="/profile" asChild>
          <MotionPressable
            ref={(node) => assignFocusableAnchorRef(firstMenuItemRef, node)}
            accessibilityRole="link"
            accessibilityLabel={profileLabel}
            preset="button"
            style={menuItemStyle}
            interactionStyle={menuItemInteractionStyle}
          >
            <AppIcon name="account" size={18} />
            <AppText role="label" style={{ flex: 1 }}>
              {profileLabel}
            </AppText>
            <AppIcon name="chevronRight" size={18} />
          </MotionPressable>
        </Link>
      ) : null}
      {showPurchases ? (
        <Link href="/me/activity" asChild>
          <MotionPressable
            ref={
              profileLabel
                ? undefined
                : (node) => assignFocusableAnchorRef(firstMenuItemRef, node)
            }
            accessibilityRole="link"
            accessibilityLabel="Покупки"
            preset="button"
            style={menuItemStyle}
            interactionStyle={menuItemInteractionStyle}
          >
            <AppIcon name="purchases" size={19} />
            <AppText role="label" style={{ flex: 1 }}>
              Покупки
            </AppText>
            <AppIcon name="chevronRight" size={18} />
          </MotionPressable>
        </Link>
      ) : null}
      {showOrders ? (
        <Link href="/orders" asChild>
          <MotionPressable
            ref={
              profileLabel || showPurchases
                ? undefined
                : (node) => assignFocusableAnchorRef(firstMenuItemRef, node)
            }
            accessibilityRole="link"
            accessibilityLabel="Сделки"
            preset="button"
            style={menuItemStyle}
            interactionStyle={menuItemInteractionStyle}
          >
            <AppIcon name="seller" size={19} />
            <AppText role="label" style={{ flex: 1 }}>
              Сделки
            </AppText>
            <AppIcon name="chevronRight" size={18} />
          </MotionPressable>
        </Link>
      ) : null}
      {showModeration ? (
        <Link href="/admin" asChild>
          <MotionPressable
            ref={
              profileLabel || showPurchases || showOrders
                ? undefined
                : (node) => assignFocusableAnchorRef(firstMenuItemRef, node)
            }
            accessibilityRole="link"
            accessibilityLabel="Модерация"
            preset="button"
            style={menuItemStyle}
            interactionStyle={menuItemInteractionStyle}
          >
            <AppIcon name="moderation" size={19} />
            <AppText role="label" style={{ flex: 1 }}>
              Модерация
            </AppText>
            <AppIcon name="chevronRight" size={18} />
          </MotionPressable>
        </Link>
      ) : null}
      {showModeration ? (
        <Link href="/(admin)/analytics" asChild>
          <MotionPressable
            accessibilityRole="link"
            accessibilityLabel="Аналитика"
            preset="button"
            style={menuItemStyle}
            interactionStyle={menuItemInteractionStyle}
          >
            <AppIcon name="catalog" size={19} />
            <AppText role="label" style={{ flex: 1 }}>
              Аналитика
            </AppText>
            <AppIcon name="chevronRight" size={18} />
          </MotionPressable>
        </Link>
      ) : null}
      {profileLabel || showPurchases || showOrders || showModeration ? (
        <View
          style={{ height: 1, backgroundColor: designTokens.color.border }}
        />
      ) : null}
      <MotionPressable
        ref={
          profileLabel || showPurchases || showOrders || showModeration
            ? undefined
            : (node) => assignFocusableAnchorRef(firstMenuItemRef, node)
        }
        accessibilityRole="button"
        accessibilityLabel="Выйти"
        accessibilityState={{ busy: loggingOut }}
        disabled={loggingOut}
        onPress={onLogout}
        preset="button"
        style={{
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x2,
          borderRadius: 14,
          paddingHorizontal: designTokens.space.x3,
        }}
        interactionStyle={({ hovered, pressed }) => ({
          backgroundColor:
            hovered || pressed ? designTokens.color.accentSoft : 'transparent',
        })}
      >
        <AppIcon name="logOut" size={18} color={designTokens.color.danger} />
        <AppText role="label" style={{ color: designTokens.color.danger }}>
          {loggingOut ? 'Выходим…' : 'Выйти'}
        </AppText>
      </MotionPressable>
    </View>
  );
}
