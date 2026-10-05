import { useState, type ReactNode } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import {
  ADMIN_MODERATION_MAX_SEARCH,
  type AdminProductStatusUpdateRequest,
  type AdminSellerStatusUpdateRequest,
} from '@bidplace/contracts';
import type { ApiClient } from '@bidplace/api-client';
import { ApiClientError } from '@bidplace/api-client';
import { Link, type Href, useRouter } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FormPageShell } from '../../components/layout';
import { MediaDeliveryNotice } from '../../components/shared/MediaDeliveryNotice';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import {
  AppDialog,
  AppText,
  DestructiveButton,
  FormSection,
  PageHeader,
  PrimaryButton,
  ResilientRemoteImage,
  SecondaryButton,
  TextButton,
  TextField,
} from '../../components/ui';
import { currentAuthEpoch } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { getApiAssetUrl } from '../../lib/environment';
import {
  presentEnum,
  productStatusLabels,
  sellerStatusLabels,
  sellerTypeLabels,
} from '../../lib/presentation';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import { formatAchievementDate } from '../sellers/achievement-date';
import { AdminReviewImage, AdminRevisionPhoto } from './AdminRevisionPhoto';
import {
  displayedProduct,
  displayedSeller,
  moderationListQueryKey,
  parentTarget,
  pendingRevision,
  revisionTarget,
  type ModerationFilter,
} from './admin-moderation-state';
import { ModerationCard } from './ModerationCard';
import { AdminUsersPanel } from './AdminUsersPanel';

type AdminSellersData = Awaited<
  ReturnType<ApiClient['admin']['listSellerProfiles']>
>;
type AdminProductsData = Awaited<
  ReturnType<ApiClient['admin']['listProducts']>
>;
type SellerProfile = AdminSellersData['sellerProfiles'][number];
type AdminProduct = AdminProductsData['products'][number];
type SellerTarget = AdminSellerStatusUpdateRequest['target'];
type ProductTarget = AdminProductStatusUpdateRequest['target'];
type Confirmation =
  | {
      kind: 'seller-suspend' | 'seller-changes' | 'seller-reject';
      id: string;
      target: SellerTarget;
    }
  | {
      kind: 'product-changes' | 'product-reject';
      id: string;
      target: ProductTarget;
    };
type ProductModerationAction = 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
type ModerationTab = 'authors' | 'works' | 'users';

async function refreshModerationLists(queryClient: QueryClient) {
  const epoch = currentAuthEpoch(queryClient);
  await Promise.all([
    queryClient.cancelQueries({ queryKey: ['admin', 'seller-profiles'] }),
    queryClient.cancelQueries({ queryKey: ['admin', 'products'] }),
  ]);
  if (currentAuthEpoch(queryClient) !== epoch) return;
  queryClient.setQueriesData<InfiniteData<AdminSellersData>>(
    { queryKey: ['admin', 'seller-profiles'] },
    (data) => keepFirstModerationPage(data),
  );
  queryClient.setQueriesData<InfiniteData<AdminProductsData>>(
    { queryKey: ['admin', 'products'] },
    (data) => keepFirstModerationPage(data),
  );
  if (currentAuthEpoch(queryClient) !== epoch) return;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin', 'seller-profiles'] }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  ]);
}

function keepFirstModerationPage<TPage>(data: InfiniteData<TPage> | undefined) {
  if (!data || data.pages.length < 2) return data;
  return {
    pages: data.pages.slice(0, 1),
    pageParams: data.pageParams.slice(0, 1),
  };
}

function moderationListRequest(
  filter: ModerationFilter,
  search: string,
  cursor: string | null,
) {
  return {
    filter,
    search: search.trim() || undefined,
    ...(cursor ? { cursor } : {}),
  };
}

export function AdminModerationScreen() {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [moderationTab, setModerationTab] = useState<ModerationTab>('authors');
  const [moderationFilter, setModerationFilter] =
    useState<ModerationFilter>('PENDING_REVIEW');
  const [moderationSearch, setModerationSearch] = useState('');
  const searchError =
    moderationSearch.trim().length > ADMIN_MODERATION_MAX_SEARCH
      ? `Поиск не длиннее ${ADMIN_MODERATION_MAX_SEARCH} символов.`
      : null;
  const sellers = useInfiniteQuery({
    queryKey: moderationListQueryKey(
      'seller-profiles',
      moderationFilter,
      moderationSearch,
    ),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      api.admin.listSellerProfiles(
        moderationListRequest(moderationFilter, moderationSearch, pageParam),
        { signal },
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: moderationTab === 'authors' && searchError == null,
  });
  const products = useInfiniteQuery({
    queryKey: moderationListQueryKey(
      'products',
      moderationFilter,
      moderationSearch,
    ),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      api.admin.listProducts(
        moderationListRequest(moderationFilter, moderationSearch, pageParam),
        { signal },
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: moderationTab === 'works' && searchError == null,
  });
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [productAction, setProductAction] =
    useState<ProductModerationAction | null>(null);
  const refresh = () => {
    void refreshModerationLists(queryClient);
  };
  const sellerStatus = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
      target,
    }: {
      id: string;
      status: 'APPROVED' | 'SUSPENDED' | 'CHANGES_REQUESTED' | 'REJECTED';
      reason?: string;
      target: SellerTarget;
    }) => api.admin.updateSellerStatus(id, { status, reason, target }),
    onSuccess: () => {
      refresh();
      setProductAction(null);
      setConfirmation(null);
    },
    onError: (error) => {
      if (error instanceof ApiClientError && error.kind === 'conflict') {
        setConfirmation(null);
        refresh();
      }
    },
  });
  const openConfirmation = (next: Confirmation) => {
    sellerStatus.reset();
    productStatus.reset();
    setProductAction(null);
    setModerationReason('');
    setConfirmation(next);
  };
  const mutateProductStatus = (input: {
    id: string;
    status: ProductModerationAction;
    reason?: string;
    target: ProductTarget;
  }) => {
    productStatus.reset();
    setProductAction(input.status);
    productStatus.mutate(input);
  };
  const productStatus = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
      target,
    }: {
      id: string;
      status: ProductModerationAction;
      reason?: string;
      target: ProductTarget;
    }) => api.admin.updateProductStatus(id, { status, reason, target }),
    onSuccess: () => {
      refresh();
      setConfirmation(null);
    },
    onError: (error) => {
      if (error instanceof ApiClientError && error.kind === 'conflict') {
        setConfirmation(null);
        refresh();
      }
    },
  });
  const confirming = sellerStatus.isPending || productStatus.isPending;

  const confirm = () => {
    if (!confirmation || !moderationReason.trim()) return;
    if (confirmation.kind === 'seller-suspend')
      sellerStatus.mutate({
        id: confirmation.id,
        status: 'SUSPENDED',
        reason: moderationReason.trim(),
        target: confirmation.target,
      });
    if (confirmation.kind === 'seller-changes')
      sellerStatus.mutate({
        id: confirmation.id,
        status: 'CHANGES_REQUESTED',
        reason: moderationReason.trim(),
        target: confirmation.target,
      });
    if (confirmation.kind === 'seller-reject')
      sellerStatus.mutate({
        id: confirmation.id,
        status: 'REJECTED',
        reason: moderationReason.trim(),
        target: confirmation.target,
      });
    if (confirmation.kind === 'product-changes')
      mutateProductStatus({
        id: confirmation.id,
        status: 'CHANGES_REQUESTED',
        reason: moderationReason.trim(),
        target: confirmation.target,
      });
    if (confirmation.kind === 'product-reject')
      mutateProductStatus({
        id: confirmation.id,
        status: 'REJECTED',
        reason: moderationReason.trim(),
        target: confirmation.target,
      });
  };
  const visibleSellers =
    sellers.data?.pages.flatMap((page) => page.sellerProfiles) ?? [];
  const visibleProducts =
    products.data?.pages.flatMap((page) => page.products) ?? [];
  const staleMessage =
    'Карточка устарела. Обновите проверку и повторите действие.';
  const confirmationText: Record<
    Confirmation['kind'],
    { title: string; description: string; label: string }
  > = {
    'seller-suspend': {
      title: 'Приостановить продавца?',
      description:
        'Публикация профиля изменится. Проверяемая ревизия при этом не одобряется.',
      label: 'Приостановить',
    },
    'seller-changes': {
      title: 'Запросить изменения профиля?',
      description:
        'Ревизия вернётся автору. Опубликованный профиль останется доступным, если он уже одобрен.',
      label: 'Запросить изменения',
    },
    'seller-reject': {
      title: 'Отклонить ревизию профиля?',
      description:
        'Ревизия будет отклонена. Опубликованный профиль останется доступным, если он уже одобрен.',
      label: 'Отклонить',
    },
    'product-changes': {
      title: 'Запросить изменения по работе?',
      description:
        'Ревизия вернётся автору. Опубликованная работа останется доступной, если она уже одобрена.',
      label: 'Запросить изменения',
    },
    'product-reject': {
      title: 'Отклонить ревизию работы?',
      description:
        'Ревизия будет отклонена. Опубликованная работа останется доступной, если она уже одобрена.',
      label: 'Отклонить',
    },
  };

  return (
    <FormPageShell>
      <PageHeader
        title="Модерация"
        description="Проверка продавцов и предметов перед публикацией."
      />
      <SecondaryButton
        label="Аналитика"
        onPress={() => router.push('/(admin)/analytics')}
      />
      <AccountLogoutButton />
      <FormSection
        title="Очередь модерации"
        description="Авторы и работы — отдельные домены с server-owned статусами и причинами решений."
      >
        <View
          accessibilityRole="tablist"
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: designTokens.space.x2,
          }}
        >
          <SecondaryButton
            label="Авторы"
            onPress={() => {
              setModerationTab('authors');
              setModerationSearch('');
            }}
          />
          <SecondaryButton
            label="Работы"
            onPress={() => {
              setModerationTab('works');
              setModerationSearch('');
            }}
          />
          <SecondaryButton
            label="Пользователи"
            onPress={() => {
              setModerationTab('users');
              setModerationSearch('');
            }}
          />
        </View>
        {moderationTab === 'authors' || moderationTab === 'works' ? (
          <>
            <TextField
              label={
                moderationTab === 'works' ? 'Найти работу' : 'Найти автора'
              }
              value={moderationSearch}
              onChangeText={setModerationSearch}
              placeholder={
                moderationTab === 'works'
                  ? 'Название или автор'
                  : 'Имя или адрес профиля'
              }
            />
            <View
              accessibilityRole="tablist"
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: designTokens.space.x2,
              }}
            >
              {(
                [
                  ['PENDING_REVIEW', 'Ожидают проверки'],
                  ['APPROVED', 'Одобрены'],
                  ['CHANGES_REQUESTED', 'Нужны правки'],
                  ['ALL', 'Все статусы'],
                ] as const
              ).map(([value, label]) => (
                <SecondaryButton
                  key={value}
                  label={moderationFilter === value ? `✓ ${label}` : label}
                  onPress={() => setModerationFilter(value)}
                />
              ))}
            </View>
          </>
        ) : null}
      </FormSection>
      {moderationTab === 'authors' ? (
        <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <FormSection title="Авторы">
            <ModerationQueryState query={sellers} blockedMessage={searchError}>
              {visibleSellers.map((seller: SellerProfile) => {
                const content = displayedSeller(seller);
                const review = seller.reviewTarget;
                const approveTarget = review
                  ? revisionTarget(review)
                  : parentTarget({
                      status: seller.parentStatus,
                      updatedAt: seller.parentUpdatedAt,
                    });
                return (
                  <ModerationCard
                    key={seller.id}
                    title={content.fullName}
                    legacy={!review}
                    reviewStatus={
                      review
                        ? presentEnum(
                            review.status,
                            sellerStatusLabels,
                            'Неизвестный статус ревизии',
                          )
                        : null
                    }
                    status={presentEnum(
                      seller.parentStatus,
                      sellerStatusLabels,
                      'Неизвестный статус продавца',
                    )}
                  >
                    <MediaDeliveryNotice delivery={seller.publication} />
                    <AppText role="bodySmall" tone="secondary">
                      {presentEnum(
                        seller.sellerType,
                        sellerTypeLabels,
                        'Неизвестный тип продавца',
                      )}{' '}
                      · {content.slug} · {content.country}
                    </AppText>
                    <AppText role="bodySmall" tone="secondary">
                      {content.discipline ?? 'Дисциплина не указана'} ·{' '}
                      {content.city ?? 'Город не указан'}
                    </AppText>
                    <AppText role="bodySmall" tone="secondary">
                      {content.shortDescription ??
                        'Краткое описание не указано'}
                    </AppText>
                    {content.practice ? (
                      <AppText role="bodySmall" tone="secondary">
                        Практика: {content.practice}
                      </AppText>
                    ) : null}
                    {content.biography ? (
                      <AppText role="bodySmall" tone="secondary">
                        Биография: {content.biography}
                      </AppText>
                    ) : null}
                    {[
                      content.socialLink,
                      content.telegramUrl,
                      content.instagramUrl,
                      content.websiteUrl,
                      content.publicEmail,
                    ]
                      .filter((value): value is string => Boolean(value))
                      .map((value) => (
                        <AppText key={value} role="bodySmall" tone="secondary">
                          {value}
                        </AppText>
                      ))}
                    {review?.content.profilePhoto ? (
                      <AdminRevisionPhoto
                        profileId={seller.id}
                        revisionId={review.id}
                        updatedAt={review.updatedAt}
                        checksum={review.content.profilePhoto.checksum}
                        label={`Фото ревизии: ${content.fullName}`}
                      />
                    ) : null}
                    {review
                      ? review.content.achievements.map((achievement) => (
                          <View
                            key={achievement.id}
                            style={{ gap: designTokens.space.x1 }}
                          >
                            {achievement.occurredDate ? (
                              <AppText role="bodySmall" tone="secondary">
                                {formatAchievementDate(
                                  achievement.occurredDate,
                                )}
                              </AppText>
                            ) : null}
                            <AppText role="bodySmall" tone="secondary">
                              {achievement.body}
                            </AppText>
                            {achievement.image ? (
                              <ResilientRemoteImage
                                uri={getApiAssetUrl(achievement.image.url)}
                                component="AuthorAchievement"
                                accessibilityLabel="Достижение"
                                fallbackLabel="Изображение достижения недоступно"
                                style={{
                                  width: 96,
                                  height: 96,
                                  borderRadius: designTokens.radius.image,
                                }}
                                contentFit="cover"
                              />
                            ) : null}
                          </View>
                        ))
                      : null}
                    {seller.lastModerationReason ? (
                      <AppText role="bodySmall" tone="secondary">
                        Последняя причина: {seller.lastModerationReason}
                      </AppText>
                    ) : null}
                    {review && pendingRevision(review.status) ? (
                      <>
                        <PrimaryButton
                          compact
                          label="Одобрить"
                          loading={sellerStatus.isPending}
                          onPress={() =>
                            sellerStatus.mutate({
                              id: seller.id,
                              status: 'APPROVED',
                              target: revisionTarget(review),
                            })
                          }
                        />
                        <DestructiveButton
                          compact
                          label="Запросить изменения"
                          loading={sellerStatus.isPending}
                          onPress={() =>
                            openConfirmation({
                              kind: 'seller-changes',
                              id: seller.id,
                              target: revisionTarget(review),
                            })
                          }
                        />
                        <DestructiveButton
                          compact
                          label="Отклонить"
                          loading={sellerStatus.isPending}
                          onPress={() =>
                            openConfirmation({
                              kind: 'seller-reject',
                              id: seller.id,
                              target: revisionTarget(review),
                            })
                          }
                        />
                      </>
                    ) : null}
                    {!review && seller.parentStatus === 'PENDING_REVIEW' ? (
                      <PrimaryButton
                        compact
                        label="Одобрить"
                        loading={sellerStatus.isPending}
                        onPress={() =>
                          sellerStatus.mutate({
                            id: seller.id,
                            status: 'APPROVED',
                            target: approveTarget,
                          })
                        }
                      />
                    ) : null}
                    <DestructiveButton
                      compact
                      disabled={
                        seller.parentStatus === 'SUSPENDED' ||
                        seller.hasBlockingListing
                      }
                      label="Приостановить"
                      loading={sellerStatus.isPending}
                      onPress={() =>
                        openConfirmation({
                          kind: 'seller-suspend',
                          id: seller.id,
                          target: parentTarget({
                            status: seller.parentStatus,
                            updatedAt: seller.parentUpdatedAt,
                          }),
                        })
                      }
                    />
                    {seller.hasBlockingListing ? (
                      <AppText role="bodySmall" tone="secondary">
                        Запланированный или активный лот: приостановка продавца
                        недоступна до завершения торгов.
                      </AppText>
                    ) : null}
                  </ModerationCard>
                );
              })}
              {visibleSellers.length === 0 ? (
                <AppText role="bodySmall" tone="secondary">
                  Нет авторов по текущему фильтру
                </AppText>
              ) : null}
              <ModerationNextPage query={sellers} />
              {sellerStatus.isError ? (
                <AppText role="bodySmall" tone="danger">
                  {sellerStatus.error instanceof ApiClientError &&
                  sellerStatus.error.kind === 'conflict'
                    ? staleMessage
                    : 'Не удалось изменить продавца. Проверьте причину и состояние активных торгов.'}
                </AppText>
              ) : null}
            </ModerationQueryState>
          </FormSection>
        </View>
      ) : null}
      {moderationTab === 'works' ? (
        <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <FormSection title="Работы">
            <ModerationQueryState query={products} blockedMessage={searchError}>
              {visibleProducts.map((product: AdminProduct) => {
                const content = displayedProduct(product);
                const review = product.reviewTarget;
                const productSellerApproved =
                  product.sellerProfile.status === 'APPROVED';
                const title = content.title ?? 'Без названия';

                return (
                  <ModerationCard
                    key={product.id}
                    title={title}
                    reviewStatus={
                      review
                        ? presentEnum(
                            review.status,
                            productStatusLabels,
                            'Неизвестный статус ревизии',
                          )
                        : null
                    }
                    status={presentEnum(
                      product.parentStatus,
                      productStatusLabels,
                      'Неизвестный статус предмета',
                    )}
                  >
                    <MediaDeliveryNotice delivery={product.publication} />
                    {content.images.length > 0 ? (
                      content.images.map((image) => (
                        <AdminReviewImage
                          key={image.id}
                          imageId={image.id}
                          checksum={image.checksum}
                          label={`Предмет: ${title}`}
                          fallbackLabel={`Изображение недоступно: ${title}`}
                        />
                      ))
                    ) : (
                      <AppText role="bodySmall" tone="danger">
                        Основное изображение отсутствует
                      </AppText>
                    )}
                    <Link
                      href={
                        {
                          pathname: '/seller/[slug]',
                          params: { slug: product.sellerProfile.slug },
                        } as Href
                      }
                      asChild
                    >
                      <TextButton
                        label={`Автор: ${product.sellerProfile.fullName}`}
                        onPress={() => undefined}
                      />
                    </Link>
                    <AppText role="bodySmall" tone="secondary">
                      {content.city ?? 'Город не указан'} ·{' '}
                      {content.story ?? 'Описание не указано'}
                    </AppText>
                    <AppText role="bodySmall" tone="secondary">
                      Категория: {content.categoryId ?? 'не указана'} · Техника:{' '}
                      {content.technique ?? 'не указана'} · Материалы:{' '}
                      {content.materials ?? 'не указаны'}
                    </AppText>
                    <AppText role="bodySmall" tone="secondary">
                      Размеры: {content.dimensions ?? 'не указаны'} · Вес:{' '}
                      {content.weight ?? 'не указан'} · Год:{' '}
                      {content.year ?? 'не указан'}
                    </AppText>
                    <AppText role="bodySmall" tone="secondary">
                      Состояние: {content.condition ?? 'не указано'} ·
                      Уникальность: {content.uniqueness ?? 'не указана'}
                    </AppText>
                    <AppText role="bodySmall" tone="secondary">
                      Происхождение: {content.provenance ?? 'не указано'} ·
                      Упаковка: {content.packaging ?? 'не указана'} · Доставка:{' '}
                      {content.deliveryInfo ?? 'не указана'}
                    </AppText>
                    <AppText role="bodySmall" tone="secondary">
                      Изображений: {content.images.length}
                    </AppText>
                    {content.creationIntro ? (
                      <AppText role="bodySmall" tone="secondary">
                        История создания: {content.creationIntro}
                      </AppText>
                    ) : (
                      <AppText role="bodySmall" tone="secondary">
                        История создания не добавлена — это необязательный
                        раздел.
                      </AppText>
                    )}
                    <AppText role="bodySmall" tone="secondary">
                      Этапы создания принадлежат работе, не ревизии.
                    </AppText>
                    {product.creationSteps.map((step) => (
                      <View
                        key={step.id}
                        style={{ gap: designTokens.space.x1 }}
                      >
                        <AppText role="label">
                          {step.position + 1}. {step.title}
                        </AppText>
                        <AppText role="bodySmall" tone="secondary">
                          {step.body}
                        </AppText>
                        {step.image ? (
                          <ResilientRemoteImage
                            uri={getApiAssetUrl(step.image.url)}
                            component="CreationStep"
                            accessibilityLabel={`Процесс: ${step.title}`}
                            fallbackLabel={`Фотография этапа недоступна: ${step.title}`}
                            style={{
                              width: 120,
                              height: 90,
                              borderRadius: designTokens.radius.image,
                            }}
                            contentFit="cover"
                          />
                        ) : null}
                      </View>
                    ))}
                    {product.lastModerationReason ? (
                      <AppText role="bodySmall" tone="secondary">
                        Последняя причина: {product.lastModerationReason}
                      </AppText>
                    ) : null}
                    {product.hasBlockingListing ? (
                      <AppText role="bodySmall" tone="secondary">
                        Запланированный или активный лот: обычное снятие с
                        публикации недоступно.
                      </AppText>
                    ) : null}
                    {review && pendingRevision(review.status) ? (
                      <PrimaryButton
                        compact
                        label="Одобрить"
                        loading={productStatus.isPending}
                        disabled={!productSellerApproved}
                        onPress={() =>
                          mutateProductStatus({
                            id: product.id,
                            status: 'APPROVED',
                            target: revisionTarget(review),
                          })
                        }
                      />
                    ) : null}
                    {review &&
                    pendingRevision(review.status) &&
                    !productSellerApproved ? (
                      <AppText role="bodySmall" tone="secondary">
                        Сначала одобрите автора.
                      </AppText>
                    ) : null}
                    {review && pendingRevision(review.status) ? (
                      <>
                        <DestructiveButton
                          compact
                          label="Запросить изменения"
                          loading={productStatus.isPending}
                          onPress={() =>
                            openConfirmation({
                              kind: 'product-changes',
                              id: product.id,
                              target: revisionTarget(review),
                            })
                          }
                        />
                        <DestructiveButton
                          compact
                          label="Отклонить"
                          loading={productStatus.isPending}
                          onPress={() =>
                            openConfirmation({
                              kind: 'product-reject',
                              id: product.id,
                              target: revisionTarget(review),
                            })
                          }
                        />
                      </>
                    ) : null}
                  </ModerationCard>
                );
              })}
              {visibleProducts.length === 0 ? (
                <AppText role="bodySmall" tone="secondary">
                  Нет работ по текущему фильтру
                </AppText>
              ) : null}
              <ModerationNextPage query={products} />
              {productStatus.isError ? (
                <AppText role="bodySmall" tone="danger">
                  {productStatus.error instanceof ApiClientError &&
                  productStatus.error.kind === 'conflict'
                    ? staleMessage
                    : productAction === 'APPROVED'
                      ? 'Не удалось одобрить предмет. Проверьте, одобрен ли автор и заполнены ли обязательные поля.'
                      : 'Не удалось изменить предмет. Проверьте причину и состояние активных торгов.'}
                </AppText>
              ) : null}
            </ModerationQueryState>
          </FormSection>
        </View>
      ) : null}
      {moderationTab === 'users' ? <AdminUsersPanel /> : null}
      {confirmation ? (
        <AppDialog
          open
          title={confirmationText[confirmation.kind].title}
          description={confirmationText[confirmation.kind].description}
          onClose={() => setConfirmation(null)}
        >
          {confirmation.kind === 'seller-suspend' ||
          confirmation.kind === 'seller-changes' ||
          confirmation.kind === 'seller-reject' ||
          confirmation.kind === 'product-changes' ||
          confirmation.kind === 'product-reject' ? (
            <TextField
              label="Причина"
              autoFocus
              value={moderationReason}
              onChangeText={setModerationReason}
              required
              multiline
              placeholder="Укажите причину действия"
              error={
                !moderationReason.trim() ? 'Причина обязательна' : undefined
              }
            />
          ) : null}
          <DestructiveButton
            label={confirmationText[confirmation.kind].label}
            loading={confirming}
            disabled={!moderationReason.trim()}
            onPress={confirm}
          />
          <SecondaryButton
            label="Отмена"
            disabled={confirming}
            onPress={() => setConfirmation(null)}
          />
        </AppDialog>
      ) : null}
    </FormPageShell>
  );
}

function ModerationQueryState({
  query,
  blockedMessage,
  children,
}: {
  query: {
    data?: unknown;
    isPending: boolean;
    isFetching: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
  };
  blockedMessage: string | null;
  children: ReactNode;
}) {
  if (blockedMessage) {
    return (
      <AppText role="bodySmall" tone="danger">
        {blockedMessage}
      </AppText>
    );
  }
  if (query.data == null) {
    const status = infrastructurePageFetchStatus(query);
    return (
      <InfrastructurePageStatus
        status={status === 'loading' ? 'loading' : 'error'}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  }
  return children;
}

function ModerationNextPage({
  query,
}: {
  query: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isFetchNextPageError: boolean;
    fetchNextPage: () => Promise<unknown>;
  };
}) {
  if (!query.hasNextPage) return null;
  return (
    <>
      {query.isFetchNextPageError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось загрузить следующую страницу.
        </AppText>
      ) : null}
      <SecondaryButton
        label={query.isFetchNextPageError ? 'Повторить' : 'Показать ещё'}
        width="block"
        loading={query.isFetchingNextPage}
        disabled={query.isFetchingNextPage}
        onPress={() => {
          void query.fetchNextPage();
        }}
      />
    </>
  );
}
