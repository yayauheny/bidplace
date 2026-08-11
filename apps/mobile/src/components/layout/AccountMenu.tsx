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
  const email = auth.user?.email ?? '';
  const initial = label.slice(0, 1).toUpperCase();
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
          minHeight: designTokens.size.touch,
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x1,
          borderRadius: designTokens.radius.pill,
          backgroundColor:
            hovered || pressed ? designTokens.color.chip : 'transparent',
          paddingHorizontal: designTokens.space.x1,
        })}
      >
        <View
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: designTokens.radius.pill,
            backgroundColor: designTokens.color.chip,
          }}
        >
          <AppText role="label">{initial}</AppText>
        </View>
        <AppIcon name="chevronDown" size={16} />
      </MotionPressable>
      {open ? (
        Platform.OS === 'web' ? (
          <OverlayPortal
            anchorRef={triggerRef}
            testId="account-menu-dropdown"
            width={designTokens.layout.accountPopoverWidth}
          >
            <AccountDropdown
              displayName={label}
              email={email}
              canOpenCabinet={capability.status === 'APPROVED'}
              loggingOut={loggingOut}
              onLogout={() => void logout()}
              firstMenuItemRef={firstMenuItemRef}
              inline={false}
            />
          </OverlayPortal>
        ) : (
          <AccountDropdown
            displayName={label}
            email={email}
            canOpenCabinet={capability.status === 'APPROVED'}
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
  displayName,
  email,
  canOpenCabinet,
  loggingOut,
  onLogout,
  firstMenuItemRef,
  inline,
}: {
  displayName: string;
  email: string;
  canOpenCabinet: boolean;
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
        borderRadius: designTokens.radius.panel,
        backgroundColor: designTokens.color.surface,
        padding: designTokens.space.x2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View style={{ gap: designTokens.space.x1, padding: designTokens.space.x2 }}>
        <AppText role="label">{displayName}</AppText>
        <AppText role="caption" tone="secondary">
          {email}
        </AppText>
      </View>
      {canOpenCabinet ? (
        <Link href="/profile" asChild>
          <MotionPressable
            ref={(node) => {
              firstMenuItemRef.current = node as unknown as {
                focus?: () => void;
              } | null;
            }}
            accessibilityRole="link"
            accessibilityLabel="Кабинет"
            preset="button"
            style={{
              minHeight: designTokens.size.touch,
              flexDirection: 'row',
              alignItems: 'center',
              gap: designTokens.space.x2,
              borderRadius: designTokens.radius.small,
              paddingHorizontal: designTokens.space.x2,
            }}
            interactionStyle={({ hovered, pressed }) => ({
              backgroundColor:
                hovered || pressed
                  ? designTokens.color.surfaceStrong
                  : 'transparent',
            })}
          >
            <AppIcon name="account" size={18} />
            <AppText role="label" style={{ flex: 1 }}>
              Кабинет
            </AppText>
            <AppIcon name="chevronRight" size={18} />
          </MotionPressable>
        </Link>
      ) : null}
      {canOpenCabinet ? (
        <View
          style={{ height: 1, backgroundColor: designTokens.color.border }}
        />
      ) : null}
      <MotionPressable
        ref={
          canOpenCabinet
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
          minHeight: designTokens.size.touch,
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x2,
          borderRadius: designTokens.radius.small,
          paddingHorizontal: designTokens.space.x2,
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
