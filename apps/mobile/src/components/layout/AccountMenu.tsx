import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { useAuth } from '../../providers/auth-provider';
import { AppIcon, AppText, IconButton } from '../modern-ui';

export function AccountMenu() {
  const auth = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const label = auth.user?.displayName?.trim() || auth.user?.email || 'Аккаунт';
  const initial = label.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const closeOnDocumentInteraction = (event: MouseEvent | KeyboardEvent) => {
      if (event.type === 'keydown' && (event as KeyboardEvent).key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.type === 'pointerdown') {
        const target = event.target;
        const menu = document.getElementById('account-menu');
        if (menu && target instanceof Node && !menu.contains(target)) {
          setOpen(false);
        }
      }
    };
    document.addEventListener('keydown', closeOnDocumentInteraction);
    document.addEventListener('pointerdown', closeOnDocumentInteraction);
    return () => {
      document.removeEventListener('keydown', closeOnDocumentInteraction);
      document.removeEventListener('pointerdown', closeOnDocumentInteraction);
    };
  }, [open]);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await auth.logout();
      router.replace('/');
    } finally {
      setLoggingOut(false);
      setOpen(false);
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
    <View nativeID="account-menu" style={{ position: 'relative', zIndex: 20 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть меню аккаунта: ${label}`}
        accessibilityState={{ expanded: open }}
        onAccessibilityEscape={() => setOpen(false)}
        onPress={() => setOpen((current) => !current)}
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
        <View
          style={{
            position: 'absolute',
            top: modernTokens.size.touch,
            right: 0,
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
          <IconButton
            icon="logOut"
            label="Выйти"
            disabled={loggingOut}
            onPress={() => void logout()}
          />
        </View>
      ) : null}
    </View>
  );
}
