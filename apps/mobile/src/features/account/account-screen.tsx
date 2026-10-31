import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { View, type LayoutChangeEvent } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AccountIdentity } from '../../components/figma/AccountIdentity';
import {
  PaddedGrid,
  gridColumnsFromWidth,
} from '../../components/figma/PaddedGrid';
import { authorSharePath } from '../../components/figma/public-share';
import { BackButton } from '../../components/figma/BackButton';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FormPageShell } from '../../components/layout';
import { navigateBack } from '../../components/layout/navigate-back';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { sellerKeys } from '../../lib/query-cache';
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
import { apiErrorMessage } from '../../lib/api-error-messages';
import { useAppTheme } from '../../providers/theme-provider';
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
  if (status === null)
    return { label: 'Стать автором', href: '/profile?intro=1' };
  if (
    status === 'DRAFT' ||
    status === 'CHANGES_REQUESTED' ||
    status === 'REJECTED'
  ) {
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
  const palette = useAppTheme();
  const auth = useAuth();
  const capability = useSellerCapability();
  const cabinet = useAuthorCabinetWorks(capability.status);
  const visibility = useAuthorCabinetVisibility();
  const [gridWidth, setGridWidth] = useState(0);
  const [claimNoticeOpen, setClaimNoticeOpen] = useState(false);

  const approved = capability.status === 'APPROVED';
  const suspended = capability.status === 'SUSPENDED';
  // Опубликованная identity живёт только в публичном author кэше; owner DTO
  // несёт editing overlay (seller-profile.mapper) и для identity не читается.
  const identity = useAccountPublicIdentity({
    enabled: approved,
    slug: capability.profile?.slug ?? null,
  });

  if (capability.isLoading || cabinet.isLoading) {
    return (
      <FormPageShell variant="account">
        <InfrastructurePageStatus status="loading" onRetry={() => undefined} />
        <AccountLogoutButton />
      </FormPageShell>
    );
  }
  if (capability.isError) {
    return (
      <FormPageShell variant="account">
        <InfrastructurePageStatus
          status="error"
          onRetry={() =>
            void queryClient.invalidateQueries({
              queryKey: sellerKeys.profile,
            })
          }
        />
        <AccountLogoutButton />
      </FormPageShell>
    );
  }
  // Ошибка первой страницы без данных — полноэкранная; ошибка следующей
  // страницы при сохранённых данных — inline, работы остаются.
  if (cabinet.isError && !cabinet.data) {
    return (
      <FormPageShell variant="account">
        <InfrastructurePageStatus
          status="error"
          onRetry={() => void cabinet.refetch()}
        />
        <AccountLogoutButton />
      </FormPageShell>
    );
  }

  const user = auth.user;
  const ownerSlug = capability.profile?.slug ?? null;
  const accountSlug = user?.slug ?? null;
  const cta = accountCta(capability.status);
  const works = cabinet.works;
  const hideIntent =
    visibility.intent?.action === 'hide' ? visibility.intent : null;
  const pendingHide = hideIntent
    ? works.find((work) => work.id === hideIntent.workId)
    : undefined;
  const columns = gridColumnsFromWidth(gridWidth, GRID_POLICY);

  // Identity: APPROVED → публичная published (A, не editing B); иначе аккаунт.
  const publishedAuthor = approved ? identity.author : null;
  // Нет displayName/публикованного имени — primary остаётся один @slug,
  // дублирующей secondary-строки не выводим.
  const displayName =
    publishedAuthor?.fullName ?? (approved ? null : user?.displayName) ?? null;
  const identitySlug = publishedAuthor?.slug ?? (approved ? null : accountSlug);
  const name: string =
    displayName ?? (identitySlug ? `@${identitySlug}` : 'Личный аккаунт');
  const handle = displayName ? identitySlug : null;
  const photoUrl = publishedAuthor ? publishedAuthor.profilePhotoUrl : null;
  const sharePath =
    publishedAuthor?.sharePath ??
    ((ownerSlug ?? accountSlug)
      ? authorSharePath(ownerSlug ?? accountSlug ?? '')
      : null);

  return (
    <FormPageShell variant="account">
      <View style={{ gap: designTokens.space.x5 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <BackButton
            onPress={() => navigateBack(router, { fallbackHref: '/' })}
          />
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
                surface="muted"
                label="Поделиться профилем"
                onPress={() => setClaimNoticeOpen(true)}
              />
            )}
            <FigmaIconButton
              icon="setting-07"
              iconSize={20}
              surface="muted"
              label="Настройки"
              onPress={() => router.push('/account/settings')}
            />
          </View>
        </View>

        {approved && identity.isLoading ? (
          // Transient loading сохраняет геометрию identity-блока.
          <View
            style={{
              flexDirection: 'row',
              gap: designTokens.space.x2,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: designTokens.size.accountAvatar,
                height: designTokens.size.accountAvatar,
                borderRadius: designTokens.radius.avatar,
                backgroundColor: palette.accountAvatarPlaceholder,
              }}
            />
            <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x1 }}>
              <View
                style={{
                  height: designTokens.typography.accountName.lineHeight,
                  borderRadius: designTokens.radius.small,
                  backgroundColor: palette.mutedFill,
                }}
              />
              <View
                style={{
                  height: designTokens.typography.accountHandle.lineHeight,
                  width: '40%',
                  borderRadius: designTokens.radius.small,
                  backgroundColor: palette.mutedFill,
                }}
              />
            </View>
          </View>
        ) : approved && identity.isError ? (
          // Локальная ошибка identity: retry рядом, кабинет работает дальше.
          <View
            style={{
              flexDirection: 'row',
              gap: designTokens.space.x2,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: designTokens.size.accountAvatar,
                height: designTokens.size.accountAvatar,
                borderRadius: designTokens.radius.avatar,
                backgroundColor: palette.accountAvatarPlaceholder,
              }}
            />
            <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x1 }}>
              <AppText role="bodySmall" tone="danger">
                Не удалось загрузить профиль. Попробуйте ещё раз.
              </AppText>
              <SecondaryButton
                label="Повторить"
                onPress={() => void identity.refetch()}
              />
            </View>
          </View>
        ) : (
          <AccountIdentity
            name={name}
            handle={handle}
            photoUrl={photoUrl}
            imageLabel={`Фото профиля: ${name}`}
            cta={
              cta ? (
                <FigmaButton
                  label={cta.label}
                  variant="solid"
                  size="matrix"
                  href={cta.href}
                />
              ) : null
            }
          />
        )}
        {suspended ? (
          <AppText role="bodySmall" tone="danger">
            Профиль ограничен
          </AppText>
        ) : null}

        {isAuthorCabinetAvailable(capability.status) ? (
          <View
            style={{ gap: designTokens.space.x3 }}
            onLayout={(event: LayoutChangeEvent) =>
              setGridWidth(event.nativeEvent.layout.width)
            }
          >
            <AppText role="sectionTitle">Работы</AppText>
            {!works.length && !cabinet.isError ? (
              <PageState
                title="У вас пока нет работ."
                message="Создайте первую работу, чтобы отправить её на модерацию."
              />
            ) : null}
            {works.length ? (
              <PaddedGrid
                items={works}
                columns={columns}
                gap={GRID_POLICY.gap}
                keyExtractor={(work) => work.id}
                renderItem={(work) => (
                  <OwnerWorkCard
                    work={work}
                    authorName={name}
                    authorSlug={handle ?? ownerSlug ?? accountSlug ?? ''}
                    isSuspended={suspended}
                    visibilityPending={visibility.mutation.isPending}
                    onHide={() =>
                      void visibility.begin({ workId: work.id, action: 'hide' })
                    }
                    onRestore={() => visibility.restore(work.id)}
                  />
                )}
              />
            ) : null}
            {cabinet.hasNextPage ? (
              <SecondaryButton
                label="Показать ещё"
                width="block"
                loading={cabinet.isFetchingNextPage}
                disabled={cabinet.isFetchingNextPage}
                onPress={() => void cabinet.fetchNextPage()}
              />
            ) : null}
            {cabinet.isError && cabinet.data ? (
              <View style={{ gap: designTokens.space.x2 }}>
                <AppText role="bodySmall" tone="danger">
                  Не удалось загрузить следующие работы. Попробуйте ещё раз.
                </AppText>
                <SecondaryButton
                  label="Повторить"
                  onPress={() => void cabinet.fetchNextPage()}
                />
              </View>
            ) : null}
            {visibility.mutation.isError &&
            visibility.intent?.action === 'restore' ? (
              <View style={{ gap: designTokens.space.x2 }}>
                <AppText role="bodySmall" tone="danger">
                  {apiErrorMessage(visibility.mutation.error) ??
                    'Не удалось изменить видимость работы. Попробуйте ещё раз.'}
                </AppText>
                <SecondaryButton label="Повторить" onPress={visibility.retry} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <AppDialog
        open={Boolean(pendingHide)}
        title="Скрыть работу?"
        description="Работа исчезнет из публичного профиля, но останется в кабинете."
        onClose={() => {
          if (!visibility.mutation.isPending) visibility.cancel();
        }}
      >
        {visibility.mutation.isError ? (
          <AppText role="bodySmall" tone="danger">
            {apiErrorMessage(visibility.mutation.error) ??
              'Не удалось скрыть работу. Попробуйте ещё раз.'}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Скрыть"
          width="block"
          loading={visibility.mutation.isPending}
          disabled={!pendingHide || visibility.mutation.isPending}
          onPress={visibility.confirm}
        />
        {visibility.mutation.isError ? (
          <SecondaryButton label="Повторить" onPress={visibility.retry} />
        ) : null}
        <SecondaryButton
          label="Отмена"
          width="block"
          disabled={visibility.mutation.isPending}
          onPress={visibility.cancel}
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
    </FormPageShell>
  );
}
