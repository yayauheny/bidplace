import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { View, type LayoutChangeEvent } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AccountIdentity } from '../../components/figma/AccountIdentity';
import { PaddedGrid, gridColumnsFromWidth } from '../../components/figma/PaddedGrid';
import { authorSharePath } from '../../components/figma/public-share';
import { BackButton } from '../../components/figma/BackButton';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { AppShell } from '../../components/layout';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import {
  AppDialog,
  AppText,
  PageState,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import { AuthorShare } from '../sellers/AuthorShare';
import {
  isAuthorCabinetAvailable,
  useSellerCapability,
} from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { OwnerWorkCard } from './owner-work-card';
import { useAccountPublicIdentity } from './use-account-public-identity';
import {
  useAuthorCabinetVisibility,
  useAuthorCabinetWorks,
} from './use-author-cabinet';

const GRID_POLICY = { minCardWidth: 179, gap: 8, max: 3 } as const;

function accountCta(status: string | null): {
  label: string;
  href: '/profile' | '/profile?intro=1' | '/products/new';
} | null {
  if (status === null) return { label: 'Стать автором', href: '/profile?intro=1' };
  if (status === 'DRAFT' || status === 'CHANGES_REQUESTED' || status === 'REJECTED') {
    return { label: 'Продолжить заявку', href: '/profile' };
  }
  if (status === 'PENDING_REVIEW') {
    return { label: 'Посмотреть заявку', href: '/profile' };
  }
  if (status === 'APPROVED') {
    return { label: 'Создать работу', href: '/products/new' };
  }
  return null; // SUSPENDED — read-only
}

export function AccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const capability = useSellerCapability();
  const cabinet = useAuthorCabinetWorks(capability.status);
  const visibility = useAuthorCabinetVisibility();
  const [gridWidth, setGridWidth] = useState(0);
  const [claimNoticeOpen, setClaimNoticeOpen] = useState(false);

  const approved = capability.status === 'APPROVED';
  const suspended = capability.status === 'SUSPENDED';
  const publicIdentity = useAccountPublicIdentity({
    enabled: approved,
    slug: capability.profile?.slug ?? null,
  });

  if (capability.isLoading || cabinet.isLoading) {
    return (
      <AppShell>
        <InfrastructurePageStatus status="loading" onRetry={() => undefined} />
        <AccountLogoutButton />
      </AppShell>
    );
  }
  if (capability.isError) {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status="error"
          onRetry={() =>
            void queryClient.invalidateQueries({
              queryKey: ['seller', 'profile'],
            })
          }
        />
        <AccountLogoutButton />
      </AppShell>
    );
  }
  if (cabinet.isError) {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status="error"
          onRetry={() => void cabinet.refetch()}
        />
        <AccountLogoutButton />
      </AppShell>
    );
  }

  // APPROVED: published identity владеет owner profile (base = опубликованное,
  // AF-03); editing revision сюда не попадает. Остальные состояния — серый
  // placeholder и данные самого аккаунта.
  const published = approved ? capability.profile : null;
  const user = auth.user;
  const accountSlug = user?.slug ?? null;
  const handle = published?.slug ?? accountSlug;
  const name =
    published?.fullName ?? user?.displayName ?? handle ?? 'Личный аккаунт';
  const photoUrl = published ? published.profilePhotoUrl : null;
  const sharePath =
    publicIdentity?.sharePath ?? (handle ? authorSharePath(handle) : null);
  const cta = accountCta(capability.status);
  const works = cabinet.works;
  const pendingHide = works.find((work) => work.id === visibility.pendingHideId);
  const columns = gridColumnsFromWidth(gridWidth, GRID_POLICY);

  return (
    <AppShell>
      <View
        style={{
          flex: 1,
          gap: designTokens.space.x5,
          paddingTop: designTokens.space.x3,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BackButton variant="settings" onPress={() => router.back()} />
          <View style={{ flexDirection: 'row', gap: designTokens.space.x1 }}>
            {sharePath ? (
              <AuthorShare
                sharePath={sharePath}
                owner
                onUnavailable={() => setClaimNoticeOpen(true)}
              />
            ) : (
              <FigmaIconButton
                icon="share-03"
                iconSize={20}
                strokeWidthPx={1.5}
                surface="muted"
                label="Поделиться профилем"
                onPress={() => setClaimNoticeOpen(true)}
              />
            )}
            <FigmaIconButton
              icon="setting-07"
              iconSize={20}
              strokeWidthPx={1.5}
              surface="muted"
              label="Настройки"
              onPress={() => router.push('/account/settings')}
            />
          </View>
        </View>

        <AccountIdentity
          name={name}
          handle={handle}
          photoUrl={photoUrl}
          imageLabel={`Фото профиля: ${name}`}
        />
        {suspended ? (
          <AppText role="bodySmall" tone="danger">
            Профиль ограничен
          </AppText>
        ) : null}
        {cta ? (
          <FigmaButton
            label={cta.label}
            variant="solid"
            size="matrix"
            width="full"
            href={cta.href}
          />
        ) : null}

        {isAuthorCabinetAvailable(capability.status) ? (
          <View
            style={{ gap: designTokens.space.x3 }}
            onLayout={(event: LayoutChangeEvent) =>
              setGridWidth(event.nativeEvent.layout.width)
            }
          >
            <AppText role="sectionTitle">Работы</AppText>
            {!works.length ? (
              <PageState
                title="У вас пока нет работ."
                message="Создайте первую работу, чтобы отправить её на модерацию."
              />
            ) : (
              <PaddedGrid
                items={works}
                columns={columns}
                gap={GRID_POLICY.gap}
                keyExtractor={(work) => work.id}
                renderItem={(work) => (
                  <OwnerWorkCard
                    work={work}
                    authorName={name}
                    isSuspended={suspended}
                    visibilityPending={visibility.mutation.isPending}
                    onHide={() => visibility.setPendingHideId(work.id)}
                    onRestore={() =>
                      visibility.mutation.mutate({ id: work.id, archived: true })
                    }
                  />
                )}
              />
            )}
            {cabinet.hasNextPage ? (
              <SecondaryButton
                label="Показать ещё"
                width="block"
                loading={cabinet.isFetchingNextPage}
                disabled={cabinet.isFetchingNextPage}
                onPress={() => void cabinet.fetchNextPage()}
              />
            ) : null}
            {cabinet.isError ? (
              <AppText role="bodySmall" tone="danger">
                Не удалось загрузить работы. Попробуйте ещё раз.
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>

      <AppDialog
        open={Boolean(pendingHide)}
        title="Скрыть работу?"
        description="Работа исчезнет из публичного профиля, но останется в кабинете."
        onClose={() => visibility.setPendingHideId(null)}
      >
        <PrimaryButton
          label="Скрыть"
          width="block"
          loading={visibility.mutation.isPending}
          disabled={!pendingHide || visibility.mutation.isPending}
          onPress={() =>
            pendingHide &&
            visibility.mutation.mutate({ id: pendingHide.id, archived: false })
          }
        />
        <SecondaryButton
          label="Отмена"
          width="block"
          disabled={visibility.mutation.isPending}
          onPress={() => visibility.setPendingHideId(null)}
        />
      </AppDialog>
      <AppDialog
        open={claimNoticeOpen}
        title="Поделиться профилем"
        description="Чтобы поделиться публичной ссылкой, сначала выберите никнейм в профиле автора."
        onClose={() => setClaimNoticeOpen(false)}
      >
        <FigmaButton
          label="Выбрать никнейм"
          variant="solid"
          size="matrix"
          width="full"
          href="/profile"
        />
        <SecondaryButton
          label="Позже"
          width="block"
          onPress={() => setClaimNoticeOpen(false)}
        />
      </AppDialog>
    </AppShell>
  );
}
