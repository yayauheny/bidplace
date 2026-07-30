import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { useAuth } from '../../providers/auth-provider';
import { AppIcon, AppText, SecondaryButton } from '../modern-ui';
import { OverlayPortal } from './OverlayHost';

export function AccountMenu({ desktop = false }: { desktop?: boolean }) {
  const auth = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const focusOpened = useRef(false);
  const triggerRef = useRef<{ getBoundingClientRect: () => DOMRect } | null>(null);
  const label = auth.user?.displayName?.trim() || auth.user?.email || 'Аккаунт';
  const initial = label.slice(0, 1).toUpperCase();
  const closeMenu = useCallback(() => {
    focusOpened.current = false;
    setOpen(false);
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
      if (event.key === 'Escape') closeMenu();
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
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Войти"
          style={{
            minHeight: modernTokens.size.touch,
            flexDirection: 'row',
            alignItems: 'center',
            gap: modernTokens.space.x2,
            paddingHorizontal: modernTokens.space.x2,
          }}
        >
          <AppIcon name="account" />
          <AppText role="label">Войти</AppText>
        </Pressable>
      </Link>
    );
  }

  return (
    <View
      nativeID="account-menu"
      style={{ position: 'relative' }}
    >
      <Pressable
        ref={(node) => {
          triggerRef.current = node as unknown as {
            getBoundingClientRect: () => DOMRect;
          } | null;
        }}
        accessibilityRole="button"
        accessibilityLabel={`Открыть меню аккаунта: ${label}`}
        accessibilityState={{ expanded: open }}
        onAccessibilityEscape={closeMenu}
        onFocus={
          desktop
            ? () => {
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
        style={({ pressed }) => ({
          minHeight: modernTokens.size.touch,
          flexDirection: 'row',
          alignItems: 'center',
          gap: modernTokens.space.x1,
          borderRadius: modernTokens.radius.pill,
          backgroundColor: pressed ? modernTokens.color.chip : 'transparent',
          paddingHorizontal: modernTokens.space.x1,
        })}
      >
        <View
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: modernTokens.radius.pill,
            backgroundColor: modernTokens.color.chip,
          }}
        >
          <AppText role="label">{initial}</AppText>
        </View>
        <AppIcon name="chevronDown" size={16} />
      </Pressable>
      {open ? (
        desktop ? (
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
        top: inline ? modernTokens.size.touch : undefined,
        right: inline ? 0 : undefined,
        minWidth: 180,
        gap: modernTokens.space.x2,
        borderWidth: 1,
        borderColor: modernTokens.color.border,
        borderRadius: modernTokens.radius.control,
        backgroundColor: modernTokens.color.surface,
        padding: modernTokens.space.x2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <AppText role="caption" tone="secondary">
        {label}
      </AppText>
      <SecondaryButton
        label="Выйти"
        loading={loggingOut}
        onPress={onLogout}
      />
    </View>
  );
}
