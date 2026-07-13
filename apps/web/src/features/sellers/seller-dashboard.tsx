'use client';

import Link from 'next/link';

import { PageContainer, Heading, Text } from '../../components/ui/layout';
import { useAuth } from '../../providers/auth-provider';
import { Card } from '../../components/ui/surfaces';
import { PrimaryButton, SecondaryButton } from '../../components/ui/controls';
import { spacing } from '../../theme/tokens';
import { XStack, YStack } from '../../components/ui/stack';

export function SellerDashboard() {
  const auth = useAuth();

  return (
    <PageContainer>
      <YStack gap={spacing[2]}>
        <Heading level="display">Seller dashboard</Heading>
        <Text tone="muted">
          {auth.user ? `${auth.user.displayName} · ${auth.user.email}` : 'Сценарии продавца'}
        </Text>
      </YStack>

      <XStack gap={spacing[3]} flexWrap="wrap">
        <Card>
          <Heading level="h3">Профиль продавца</Heading>
          <Text tone="muted">Создайте или обновите публичный профиль.</Text>
          <XStack gap={spacing[2]} flexWrap="wrap">
            <SecondaryButton asChild>
              <Link href="/seller/profile/create">Создать</Link>
            </SecondaryButton>
            <PrimaryButton asChild>
              <Link href="/seller/profile/edit">Обновить</Link>
            </PrimaryButton>
          </XStack>
        </Card>

        <Card>
          <Heading level="h3">Лоты и аукционы</Heading>
          <Text tone="muted">Добавляйте лот, создавайте аукцион и публикуйте его.</Text>
          <XStack gap={spacing[2]} flexWrap="wrap">
            <SecondaryButton asChild>
              <Link href="/seller/lots/new">Новый лот</Link>
            </SecondaryButton>
            <PrimaryButton asChild>
              <Link href="/seller/auctions/new">Новый аукцион</Link>
            </PrimaryButton>
          </XStack>
        </Card>
      </XStack>
    </PageContainer>
  );
}
