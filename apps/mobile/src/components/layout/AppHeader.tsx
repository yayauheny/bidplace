import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, YStack, useMedia } from 'tamagui';

import { useAuth } from '../../providers/auth-provider';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { BrandLogo } from './BrandLogo';
import { DesktopNavigation } from './DesktopNavigation';
import { MobileNavigationDrawer } from './MobileNavigationDrawer';

type AppHeaderProps = {
  mode?: 'public' | 'seller' | 'admin' | 'auth';
};

function ActionLabel({ children }: { children: ReactNode }) {
  return (
    <Text color="$text" style={{ fontSize: 12, letterSpacing: 1.1, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

export function AppHeader({ mode = 'public' }: AppHeaderProps) {
  const media = useMedia();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const isDesktop = Boolean(media.desktop || media.wide);
  const profileHref = auth.isAuthenticated ? '/me/activity' : '/login';
  const sectionLabel =
    mode === 'admin' ? 'Admin' : mode === 'seller' ? 'Seller' : 'EN';

  return (
    <>
      <YStack
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#DFDDD7',
          backgroundColor: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <XStack
          style={{
            width: '100%',
            maxWidth: mobileLayout.pageMaxWidth,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: mobileSpacing[3],
            paddingHorizontal: mobileSpacing[4],
            paddingVertical: mobileSpacing[3],
            minHeight: 60,
          }}
        >
          <XStack style={{ flex: 1, alignItems: 'center', gap: mobileSpacing[3] }}>
            {isDesktop ? (
              <DesktopNavigation />
            ) : (
              <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
                <ActionLabel>Menu</ActionLabel>
              </Pressable>
            )}
          </XStack>

          <XStack style={{ flex: 1, justifyContent: 'center' }}>
            <BrandLogo compact={!isDesktop} />
          </XStack>

          <XStack
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: mobileSpacing[3],
            }}
          >
            <ActionLabel>{sectionLabel}</ActionLabel>
            <Link href={profileHref} asChild>
              <Pressable accessibilityRole="link">
                <ActionLabel>Profile</ActionLabel>
              </Pressable>
            </Link>
          </XStack>
        </XStack>
      </YStack>
      {!isDesktop ? (
        <MobileNavigationDrawer
          open={open}
          onOpenChange={setOpen}
          profileHref={profileHref}
        />
      ) : null}
    </>
  );
}
