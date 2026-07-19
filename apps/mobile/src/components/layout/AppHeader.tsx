import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { Text, XStack, YStack, useMedia } from 'tamagui';

import { useAuth } from '../../providers/auth-provider';
import { mobileLayout, mobileSpacing, fontFamilies } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { BrandLogo } from './BrandLogo';
import { DesktopNavigation } from './DesktopNavigation';
import { MobileNavigationDrawer } from './MobileNavigationDrawer';

type AppHeaderProps = {
  mode?: 'public' | 'seller' | 'admin' | 'auth';
};

function NavAction({
  href,
  children,
}: {
  href: '/profile' | '/me/activity' | '/login';
  children: ReactNode;
}) {
  const palette = useAppThemePalette();
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Text
          style={{
            fontFamily: fontFamilies.sansMedium,
            fontSize: 13,
            lineHeight: 18,
            letterSpacing: 0.2,
            color: palette.colorSecondary,
          }}
        >
          {children}
        </Text>
      </Pressable>
    </Link>
  );
}

function MenuTrigger({ onPress }: { onPress: () => void }) {
  const palette = useAppThemePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      aria-label="Открыть меню"
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
        padding: mobileSpacing[2],
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
          lineHeight: 18,
          color: palette.colorSecondary,
        }}
      >
        Меню
      </Text>
    </Pressable>
  );
}

export function AppHeader({ mode = 'public' }: AppHeaderProps) {
  const media = useMedia();
  const auth = useAuth();
  const palette = useAppThemePalette();
  const [open, setOpen] = useState(false);
  const isDesktop = Boolean(media.desktop || media.wide);
  const profileHref = auth.isAuthenticated ? '/me/activity' : '/login';

  return (
    <>
      <YStack
        style={[
          {
            borderBottomWidth: 1,
            borderBottomColor: palette.borderColor,
            backgroundColor: palette.surface,
            top: 0,
            zIndex: 30,
          },
          // sticky is a web-only CSS value — apply only on web
          Platform.select({ web: { position: 'sticky' } as object, default: {} }),
        ]}
      >
        <XStack
          style={{
            width: '100%',
            maxWidth: mobileLayout.pageMaxWidth,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: mobileSpacing[5],
            minHeight: 56,
          }}
        >
          {/* Left: nav or menu trigger */}
          <XStack style={{ flex: 1, alignItems: 'center', gap: mobileSpacing[5] }}>
            {isDesktop ? (
              <DesktopNavigation mode={mode} />
            ) : (
              <MenuTrigger onPress={() => setOpen(true)} />
            )}
          </XStack>

          {/* Center: brand lockup */}
          <XStack style={{ alignItems: 'center' }}>
            <BrandLogo compact={!isDesktop} />
          </XStack>

          {/* Right: profile / context actions */}
          <XStack
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: mobileSpacing[4],
            }}
          >
            {mode === 'admin' ? (
              <Text
                style={{
                  fontFamily: fontFamilies.sansMedium,
                  fontSize: 12,
                  color: palette.warning,
                  fontWeight: '600',
                }}
              >
                Admin
              </Text>
            ) : mode === 'seller' ? (
              <NavAction href="/profile">Продавец</NavAction>
            ) : null}
            <NavAction href={profileHref}>
              {auth.isAuthenticated ? 'Мои покупки' : 'Войти'}
            </NavAction>
          </XStack>
        </XStack>
      </YStack>

      {!isDesktop ? (
        <MobileNavigationDrawer
          open={open}
          onOpenChange={setOpen}
          profileHref={profileHref}
          mode={mode}
        />
      ) : null}
    </>
  );
}
