import { PageScrollView } from '../../components/layout/PageScrollView';
import { CroppedPhoto } from '../../components/shared/CroppedPhoto';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FormPageShell } from '../../components/layout';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import {
  AppDialog,
  AppText,
  ImagePlaceholder,
  PageHeader,
  PageState,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import {
  isAuthorCabinetAvailable,
  useSellerCapability,
} from '../../hooks/use-seller-capability';
import { useAppTheme } from '../../providers/theme-provider';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import {
  authorCabinetPrimaryAction,
  authorCabinetVisibilityActions,
  authorCabinetWorkState,
} from './author-cabinet-state';
import {
  useAuthorCabinetVisibility,
  useAuthorCabinetWorks,
} from '../account/use-author-cabinet';

export function AuthorCabinetScreen() {
  const palette = useAppTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const capability = useSellerCapability();
  const query = useAuthorCabinetWorks(capability.status);
  const visibility = useAuthorCabinetVisibility();

  useEffect(() => {
    if (
      !capability.isLoading &&
      !capability.isError &&
      !isAuthorCabinetAvailable(capability.status)
    ) {
      router.replace('/profile');
    }
  }, [capability.isError, capability.isLoading, capability.status, router]);

  const works = query.works;
  const hideIntent =
    visibility.intent?.action === 'hide' ? visibility.intent : null;
  const pendingHide = hideIntent
    ? works.find((work) => work.id === hideIntent.workId)
    : undefined;

  if (capability.isLoading || query.isLoading) {
    return (
      <AppShell contentLayout="bleed">
        <PageScrollView>
          <InfrastructurePageStatus
            status="loading"
            onRetry={() => undefined}
          />
          <AccountLogoutButton />
        </PageScrollView>
      </AppShell>
    );
  }
  if (capability.isError) {
    return (
      <AppShell contentLayout="bleed">
        <PageScrollView>
          <InfrastructurePageStatus
            status="error"
            onRetry={() =>
              void queryClient.invalidateQueries({
                queryKey: ['seller', 'profile'],
              })
            }
          />
          <AccountLogoutButton />
        </PageScrollView>
      </AppShell>
    );
  }
  if (!isAuthorCabinetAvailable(capability.status)) return null;
  if (query.isError) {
    return (
      <AppShell contentLayout="bleed">
        <PageScrollView>
          <InfrastructurePageStatus
            status="error"
            onRetry={() => void query.refetch()}
          />
          <AccountLogoutButton />
        </PageScrollView>
      </AppShell>
    );
  }

  return (
    <FormPageShell footer>
      <View style={{ gap: designTokens.space.x5 }}>
        <PageHeader title="Кабинет автора" />
        <View style={{ gap: designTokens.space.x1 }}>
          <AppText role="sectionTitle">{capability.profile?.fullName}</AppText>
          <AppText role="bodySmall" tone="secondary">
            @{capability.profile?.slug}
          </AppText>
          {capability.status === 'SUSPENDED' ? (
            <AppText role="bodySmall" tone="danger">
              Профиль ограничен
            </AppText>
          ) : null}
        </View>
        <View style={{ gap: designTokens.space.x2 }}>
          <SecondaryButton
            label={
              capability.status === 'SUSPENDED'
                ? 'Открыть профиль'
                : 'Редактировать профиль'
            }
            width="block"
            href="/profile"
          />
          {capability.status === 'APPROVED' ? (
            <>
              <SecondaryButton
                label="Открыть профиль"
                width="block"
                href={`/authors/${capability.profile?.slug}`}
              />
              <PrimaryButton
                label="Создать работу"
                width="block"
                href="/products/new"
              />
            </>
          ) : null}
          <AccountLogoutButton />
        </View>
        {!works.length ? (
          <PageState
            title="У вас пока нет работ."
            message="Создайте первую работу, чтобы отправить её на модерацию."
          />
        ) : (
          works.map((work) => (
            <View
              key={work.id}
              style={{
                gap: designTokens.space.x3,
                padding: designTokens.space.x4,
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: designTokens.radius.card,
              }}
            >
              {work.coverImage ? (
                <CroppedPhoto
                  crop={work.coverImage.crop}
                  sourceWidth={work.coverImage.width}
                  sourceHeight={work.coverImage.height}
                  uri={getApiAssetUrl(work.coverImage.url)}
                  component="WorkCoverCard"
                  accessibilityLabel={work.title ?? 'Работа'}
                  fallbackLabel="Обложка работы недоступна"
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: designTokens.radius.image,
                  }}
                />
              ) : (
                <ImagePlaceholder
                  ratio={1}
                  label="Обложка работы не добавлена"
                />
              )}
              <View style={{ gap: designTokens.space.x1 }}>
                <AppText role="sectionTitle">
                  {work.title ?? 'Без названия'}
                </AppText>
                <AppText role="bodySmall" tone="secondary">
                  {authorCabinetWorkState(work)}
                </AppText>
                {work.moderationMessage ? (
                  <AppText role="bodySmall" tone="danger">
                    {work.moderationMessage}
                  </AppText>
                ) : null}
              </View>
              <PrimaryButton
                label={authorCabinetPrimaryAction({
                  status: work.status,
                  editingRevisionStatus: work.editingRevisionStatus,
                  isSuspended: capability.status === 'SUSPENDED',
                })}
                width="block"
                href={`/products/${work.id}`}
              />
              {authorCabinetVisibilityActions({
                status: work.status,
                isSuspended: capability.status === 'SUSPENDED',
              }).canHide ? (
                <SecondaryButton
                  label="Скрыть"
                  width="block"
                  disabled={visibility.mutation.isPending}
                  onPress={() =>
                    void visibility.begin({ workId: work.id, action: 'hide' })
                  }
                />
              ) : null}
              {authorCabinetVisibilityActions({
                status: work.status,
                isSuspended: capability.status === 'SUSPENDED',
              }).canRestore ? (
                <SecondaryButton
                  label="Вернуть в профиль"
                  width="block"
                  loading={visibility.mutation.isPending}
                  disabled={visibility.mutation.isPending}
                  onPress={() => visibility.restore(work.id)}
                />
              ) : null}
            </View>
          ))
        )}
        {query.hasNextPage ? (
          <SecondaryButton
            label="Показать ещё"
            width="block"
            loading={query.isFetchingNextPage}
            disabled={query.isFetchingNextPage}
            onPress={() => void query.fetchNextPage()}
          />
        ) : null}
        {visibility.mutation.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось изменить видимость работы. Попробуйте ещё раз.
          </AppText>
        ) : null}
        <AppDialog
          open={Boolean(pendingHide)}
          title="Скрыть работу?"
          description="Работа исчезнет из публичного профиля, но останется в кабинете."
          onClose={() => {
            if (!visibility.mutation.isPending) visibility.cancel();
          }}
        >
          <PrimaryButton
            label="Скрыть"
            width="block"
            loading={visibility.mutation.isPending}
            disabled={!pendingHide || visibility.mutation.isPending}
            onPress={visibility.confirm}
          />
          <SecondaryButton
            label="Отмена"
            width="block"
            disabled={visibility.mutation.isPending}
            onPress={visibility.cancel}
          />
        </AppDialog>
      </View>
    </FormPageShell>
  );
}
