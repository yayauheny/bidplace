import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useAuth } from '../../providers/auth-provider';
import {
  AppIcon,
  AppText,
  MotionPressable,
  SecondaryButton,
} from '../ui';
import { OverlayPortal } from './OverlayHost';

export function AccountMenu({ desktop = false }: { desktop?: boolean }) {
  const auth = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const focusOpened = useRef(false);
  const suppressNextFocusOpen = useRef(false);
  const triggerRef = useRef<{
    getBoundingClientRect: () => DOMRect;
    focus?: () => void;
  } | null>(null);
  const label = auth.user?.displayName?.trim() || auth.user?.email || 'Аккаунт';
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
          <OverlayPortal anchorRef={triggerRef} testId="account-menu-dropdown">
            <AccountDropdown
              label={label}
              loggingOut={loggingOut}
              onLogout={() => void logout()}
              inline={false}
            />
          </OverlayPortal>
        ) : (
          <AccountDropdown
            label={label}
            loggingOut={loggingOut}
            onLogout={() => void logout()}
            inline
          />
        )
      ) : null}
    </View>
  );
}

function AccountDropdown({
  label,
  loggingOut,
  onLogout,
  inline,
}: {
  label: string;
  loggingOut: boolean;
  onLogout: () => void;
  inline: boolean;
}) {
  return (
    <View
      style={{
        position: inline ? 'absolute' : undefined,
        top: inline ? designTokens.size.touch : undefined,
        right: inline ? 0 : undefined,
        minWidth: 180,
        gap: designTokens.space.x2,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        borderRadius: designTokens.radius.control,
        backgroundColor: designTokens.color.surface,
        padding: designTokens.space.x2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <AppText role="caption" tone="secondary">
        {label}
      </AppText>
      <SecondaryButton label="Выйти" loading={loggingOut} onPress={onLogout} />
    </View>
  );
}
