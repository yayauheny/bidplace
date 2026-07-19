import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { fontFamilies, mobileRadius, mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { AppSheet } from '../ui';

type MobileNavigationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileHref: '/me/activity' | '/login';
  mode?: 'public' | 'seller' | 'admin' | 'auth';
};

const navItems = [
  { label: 'Каталог', href: '/' as const },
  { label: 'Мои покупки', href: '/me/activity' as const },
];

export function MobileNavigationDrawer({
  open,
  onOpenChange,
  profileHref,
  mode = 'public',
}: MobileNavigationDrawerProps) {
  const palette = useAppThemePalette();
  const router = useRouter();

  // Close on Escape (web)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onOpenChange(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} snapPoints={[92]}>
      <YStack style={{ flex: 1, gap: 0 }}>
        {/* Close row */}
        <XStack
          style={{
            justifyContent: 'flex-end',
            paddingHorizontal: mobileSpacing[5],
            paddingTop: mobileSpacing[2],
            paddingBottom: mobileSpacing[4],
          }}
        >
          <Pressable
            onPress={() => onOpenChange(false)}
            accessibilityRole="button"
            accessibilityLabel="Закрыть меню"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              minWidth: 44,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text
              style={{
                fontFamily: fontFamilies.sansMedium,
                fontSize: 13,
                color: palette.colorMuted,
                letterSpacing: 0.2,
              }}
            >
              Закрыть
            </Text>
          </Pressable>
        </XStack>

        {/* Nav items — large editorial typography */}
        <YStack style={{ gap: 0, paddingHorizontal: mobileSpacing[5] }}>
          {navItems.map((item) => (
            <Link key={`${item.label}-${item.href}`} href={item.href} asChild>
              <Pressable
                onPress={() => onOpenChange(false)}
                accessibilityRole="link"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  paddingVertical: mobileSpacing[4],
                  borderBottomWidth: 1,
                  borderBottomColor: palette.borderColor,
                })}
              >
                <Text
                  style={{
                    fontFamily: fontFamilies.serifRegular,
                    color: palette.color,
                    fontSize: 32,
                    lineHeight: 40,
                    fontWeight: '500',
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          ))}

          {mode === 'seller' ? (
            <Pressable
              onPress={() => { onOpenChange(false); router.push('/profile'); }}
              accessibilityRole="link"
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                paddingVertical: mobileSpacing[4],
                borderBottomWidth: 1,
                borderBottomColor: palette.borderColor,
              })}
            >
              <Text
                style={{
                  fontFamily: fontFamilies.serifRegular,
                  color: palette.color,
                  fontSize: 32,
                  lineHeight: 40,
                  fontWeight: '500',
                }}
              >
                Продавать
              </Text>
            </Pressable>
          ) : null}
          {mode === 'admin' ? (
            <Pressable
              onPress={() => { onOpenChange(false); router.push('/admin'); }}
              accessibilityRole="link"
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                paddingVertical: mobileSpacing[4],
                borderBottomWidth: 1,
                borderBottomColor: palette.borderColor,
              })}
            >
              <Text
                style={{
                  fontFamily: fontFamilies.serifRegular,
                  color: palette.color,
                  fontSize: 32,
                  lineHeight: 40,
                  fontWeight: '500',
                }}
              >
                Модерация
              </Text>
            </Pressable>
          ) : null}
        </YStack>

        {/* Profile link at bottom */}
        <YStack style={{ paddingHorizontal: mobileSpacing[5], paddingTop: mobileSpacing[6] }}>
          <Pressable
            onPress={() => { onOpenChange(false); router.push(profileHref); }}
            accessibilityRole="link"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              paddingVertical: mobileSpacing[3],
              paddingHorizontal: mobileSpacing[4],
              borderRadius: mobileRadius.control,
              borderWidth: 1,
              borderColor: palette.borderColor,
              alignItems: 'center',
              minHeight: 44,
              justifyContent: 'center',
            })}
          >
            <Text
              style={{
                fontFamily: fontFamilies.sansMedium,
                color: palette.colorSecondary,
                fontSize: 14,
                letterSpacing: 0.2,
              }}
            >
              {profileHref === '/me/activity' ? 'Мои покупки' : 'Войти'}
            </Text>
          </Pressable>
        </YStack>
      </YStack>
    </AppSheet>
  );
}
