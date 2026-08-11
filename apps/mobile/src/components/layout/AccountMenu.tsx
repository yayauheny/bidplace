import { Link, useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
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

const menuItemStyle = {
  minHeight: 48,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: designTokens.space.x3,
  borderRadius: 14,
  paddingHorizontal: designTokens.space.x3,
};

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
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const focusOpened = useRef(false);
  const suppressNextFocusOpen = useRef(false);
  const firstMenuItemRef = useRef<{ focus?: () => void } | null>(null);
  const triggerRef = useRef<{
    getBoundingClientRect: () => DOMRect;
    focus?: () => void;
  } | null>(null);
  const label = auth.user?.displayName?.trim() || auth.user?.email || 'Аккаунт';
  const profileLabel = auth.isAdmin
    ? null
    : capability.status === 'APPROVED'
      ? 'Кабинет'
      : capability.profile
        ? 'Заявка продавца'
        : 'Стать продавцом';
  const closeMenu = useCallback((restoreFocus = false) => {
    focusOpened.current = false;
    setOpen(false);
    if (restoreFocus) {
      suppressNextFocusOpen.current = true;
      triggerRef.current?.focus?.();
      queueMicrotask(() => {
        suppressNextFocusOpen.current = false;
      });
    }
  }, []);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const closeIfOutside = (target: EventTarget | null) => {
      const menu = document.getElementById('account-menu');
      const dropdown = document.getElementById('account-menu-dropdown');
      if (
        menu &&
        dropdown &&
        target instanceof Node &&
        !menu.contains(target) &&
        !dropdown.contains(target)
      ) {
        closeMenu();
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
      }
    };
    const closeOnPointerDown = (event: PointerEvent) =>
      closeIfOutside(event.target);
    const closeOnFocusIn = (event: FocusEvent) => closeIfOutside(event.target);

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnPointerDown);
    document.addEventListener('focusin', closeOnFocusIn);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnPointerDown);
      document.removeEventListener('focusin', closeOnFocusIn);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open || !focusOpened.current || Platform.OS !== 'web') return;

    queueMicrotask(() => firstMenuItemRef.current?.focus?.());
  }, [open]);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await auth.logout();
      router.replace('/');
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
        ref={(node) => {
          triggerRef.current = node as unknown as {
            getBoundingClientRect: () => DOMRect;
            focus?: () => void;
          } | null;
        }}
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
        onHoverIn={desktop ? () => setOpen(true) : undefined}
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
              showPurchases={!auth.isAdmin}
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
            showPurchases={!auth.isAdmin}
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
  showModeration,
  loggingOut,
  onLogout,
  firstMenuItemRef,
  inline,
}: {
  profileLabel: string | null;
  showPurchases: boolean;
  showModeration: boolean;
  loggingOut: boolean;
  onLogout: () => void;
  firstMenuItemRef: MutableRefObject<{ focus?: () => void } | null>;
  inline: boolean;
}) {
  return (
    <View
      style={{
        position: inline ? 'absolute' : undefined,
        top: inline ? designTokens.size.touch : undefined,
        right: inline ? 0 : undefined,
        width: inline ? undefined : designTokens.layout.accountPopoverWidth,
        minWidth: inline ? designTokens.layout.accountPopoverWidth : undefined,
        gap: designTokens.space.x2,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        borderRadius: 22,
        backgroundColor: designTokens.color.surface,
        padding: 10,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {profileLabel ? (
        <Link href="/profile" asChild>
          <MotionPressable
            ref={(node) => {
              firstMenuItemRef.current = node as unknown as {
                focus?: () => void;
              } | null;
            }}
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
                : (node) => {
                    firstMenuItemRef.current = node as unknown as {
                      focus?: () => void;
                    } | null;
                  }
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
      {showModeration ? (
        <Link href="/admin" asChild>
          <MotionPressable
            ref={
              profileLabel || showPurchases
                ? undefined
                : (node) => {
                    firstMenuItemRef.current = node as unknown as {
                      focus?: () => void;
                    } | null;
                  }
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
      {profileLabel || showPurchases || showModeration ? (
        <View
          style={{ height: 1, backgroundColor: designTokens.color.border }}
        />
      ) : null}
      <MotionPressable
        ref={
          profileLabel
            ? undefined
            : (node) => {
                firstMenuItemRef.current = node as unknown as {
                  focus?: () => void;
                } | null;
              }
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
