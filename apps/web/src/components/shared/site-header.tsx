'use client';

import Link from 'next/link';

import { useThemeSetting } from '@tamagui/next-theme';

import { useAuth } from '../../providers/auth-provider';
import { radius, spacing } from '../../theme/tokens';
import { PrimaryButton, SecondaryButton } from '../ui/controls';
import { PageContainer, Text } from '../ui/layout';
import { XStack, YStack } from '../ui/stack';

function ThemeToggle() {
  const theme = useThemeSetting();

  return (
    <SecondaryButton
      onPress={theme.toggle}
      accessibilityLabel="Переключить тему"
      size="$3"
    >
      {theme.current === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    </SecondaryButton>
  );
}

export function SiteHeader() {
  const auth = useAuth();

  return (
    <YStack borderBottomWidth={1} borderBottomColor="$borderColor">
      <PageContainer
        paddingVertical={spacing[3]}
        gap={spacing[3]}
        justifyContent="space-between"
      >
        <XStack
          alignItems="center"
          justifyContent="space-between"
          gap={spacing[3]}
          flexWrap="wrap"
        >
          <Link href="/" aria-label="BidPlace">
            <XStack
              alignItems="center"
              gap={spacing[2]}
              paddingHorizontal={spacing[3]}
              paddingVertical={spacing[2]}
              borderRadius={radius.full}
              backgroundColor="$surface"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text size="small" weight="strong">
                BidPlace
              </Text>
            </XStack>
          </Link>

          <XStack alignItems="center" gap={spacing[2]} flexWrap="wrap">
            <Link href="/">
              <Text size="small" tone="muted">
                Каталог
              </Text>
            </Link>
            <Link href="/seller">
              <Text size="small" tone="muted">
                Seller
              </Text>
            </Link>
            <Link href="/admin">
              <Text size="small" tone="muted">
                Admin
              </Text>
            </Link>
            <ThemeToggle />
          {auth.isAuthenticated ? (
            <SecondaryButton onPress={auth.logout} size="$3">
              Выйти
            </SecondaryButton>
          ) : (
              <XStack gap={spacing[2]}>
                <SecondaryButton asChild size="$3">
                  <Link href="/login">Вход</Link>
                </SecondaryButton>
                <PrimaryButton asChild size="$3">
                  <Link href="/register">Регистрация</Link>
                </PrimaryButton>
              </XStack>
            )}
          </XStack>
        </XStack>
      </PageContainer>
    </YStack>
  );
}
