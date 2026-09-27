import { useEffect, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
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
  ResilientRemoteImage,
  SecondaryButton,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import {
  isAuthorCabinetAvailable,
  useSellerCapability,
} from '../../hooks/use-seller-capability';
import { useApiClient } from '../../providers/api-provider';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import {
  AUTHOR_CABINET_PAGE_SIZE,
  authorCabinetPrimaryAction,
  authorCabinetVisibilityActions,
  authorCabinetWorksFromPages,
  authorCabinetWorkState,
} from './author-cabinet-state';

export function AuthorCabinetScreen() {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const capability = useSellerCapability();
  const [pendingHideId, setPendingHideId] = useState<string | null>(null);
  const query = useInfiniteQuery({
    queryKey: ['seller', 'cabinet', 'works'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.portfolio.listCabinetWorks({
        page: pageParam,
        limit: AUTHOR_CABINET_PAGE_SIZE,
      }),
    getNextPageParam: (page) =>
      page.pagination.page * page.pagination.limit < page.pagination.total
        ? page.pagination.page + 1
        : undefined,
    enabled: isAuthorCabinetAvailable(capability.status),
  });

  useEffect(() => {
    if (
      !capability.isLoading &&
      !capability.isError &&
      !isAuthorCabinetAvailable(capability.status)
    ) {
      router.replace('/profile');
    }
  }, [capability.isError, capability.isLoading, capability.status, router]);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ['seller', 'cabinet', 'works'],
    });
    void queryClient.invalidateQueries({ queryKey: ['seller', 'product'] });
    void queryClient.invalidateQueries({ queryKey: ['public-author'] });
    void queryClient.invalidateQueries({ queryKey: ['portfolio-home'] });
    void queryClient.invalidateQueries({ queryKey: ['portfolio-work'] });
    void queryClient.invalidateQueries({ queryKey: ['portfolio-works'] });
  };
  const visibility = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archived ? api.portfolio.unhideWork(id) : api.portfolio.hideWork(id),
    onSuccess: () => {
      setPendingHideId(null);
      invalidate();
    },
  });

  if (capability.isLoading || query.isLoading) {
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
  if (!isAuthorCabinetAvailable(capability.status)) return null;
  if (query.isError) {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status="error"
          onRetry={() => void query.refetch()}
        />
        <AccountLogoutButton />
      </AppShell>
    );
  }

  const works = authorCabinetWorksFromPages(query.data?.pages ?? []);
  const pendingHide = works.find((work) => work.id === pendingHideId);

  return (
    <FormPageShell>
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
          <Link href="/profile" asChild>
            <SecondaryButton
              label={
                capability.status === 'SUSPENDED'
                  ? 'Открыть профиль'
                  : 'Редактировать профиль'
              }
              width="block"
              onPress={() => undefined}
            />
          </Link>
          {capability.status === 'APPROVED' ? (
            <>
              <Link href={`/authors/${capability.profile?.slug}`} asChild>
                <SecondaryButton
                  label="Открыть профиль"
                  width="block"
                  onPress={() => undefined}
                />
              </Link>
              <Link href="/products/new" asChild>
                <PrimaryButton
                  label="Создать работу"
                  width="block"
                  onPress={() => undefined}
                />
              </Link>
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
                borderColor: designTokens.color.border,
                borderRadius: designTokens.radius.card,
              }}
            >
              {work.coverImage ? (
                <ResilientRemoteImage
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
              <Link href={`/products/${work.id}`} asChild>
                <PrimaryButton
                  label={authorCabinetPrimaryAction({
                    status: work.status,
                    editingRevisionStatus: work.editingRevisionStatus,
                    isSuspended: capability.status === 'SUSPENDED',
                  })}
                  width="block"
                  onPress={() => undefined}
                />
              </Link>
              {authorCabinetVisibilityActions({
                status: work.status,
                isSuspended: capability.status === 'SUSPENDED',
              }).canHide ? (
                <SecondaryButton
                  label="Скрыть"
                  width="block"
                  onPress={() => setPendingHideId(work.id)}
                />
              ) : null}
              {authorCabinetVisibilityActions({
                status: work.status,
                isSuspended: capability.status === 'SUSPENDED',
              }).canRestore ? (
                <SecondaryButton
                  label="Вернуть в профиль"
                  width="block"
                  loading={visibility.isPending}
                  disabled={visibility.isPending}
                  onPress={() =>
                    visibility.mutate({ id: work.id, archived: true })
                  }
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
        {visibility.isError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось изменить видимость работы. Попробуйте ещё раз.
          </AppText>
        ) : null}
        <AppDialog
          open={Boolean(pendingHide)}
          title="Скрыть работу?"
          description="Работа исчезнет из публичного профиля, но останется в кабинете."
          onClose={() => setPendingHideId(null)}
        >
          <PrimaryButton
            label="Скрыть"
            width="block"
            loading={visibility.isPending}
            disabled={!pendingHide || visibility.isPending}
            onPress={() =>
              pendingHide &&
              visibility.mutate({ id: pendingHide.id, archived: false })
            }
          />
          <SecondaryButton
            label="Отмена"
            width="block"
            disabled={visibility.isPending}
            onPress={() => setPendingHideId(null)}
          />
        </AppDialog>
      </View>
    </FormPageShell>
  );
}
