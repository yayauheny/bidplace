import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiClient } from '@bidplace/api-client';
import { Link, type Href, useRouter } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FormPageShell } from '../../components/layout';
import {
  AppDialog,
  AppText,
  DestructiveButton,
  FormSection,
  PageHeader,
  PageState,
  PrimaryButton,
  ResilientRemoteImage,
  SecondaryButton,
  TextButton,
  TextField,
} from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { getApiAssetUrl } from '../../lib/environment';
import {
  cancellationReasonLabels,
  presentEnum,
  productStatusLabels,
  sellerStatusLabels,
  sellerTypeLabels,
} from '../../lib/presentation';
import { ModerationCard } from './ModerationCard';
import { AdminUsersPanel } from './AdminUsersPanel';

type AdminSellersData = Awaited<
  ReturnType<ApiClient['admin']['listSellerProfiles']>
>;
type AdminProductsData = Awaited<
  ReturnType<ApiClient['admin']['listProducts']>
>;
type RankedBidsData = Awaited<ReturnType<ApiClient['admin']['listRankedBids']>>;
type SellerProfile = AdminSellersData['sellerProfiles'][number];
type AdminProduct = AdminProductsData['products'][number];
type RankedBid = RankedBidsData['bids'][number];
type Confirmation =
  | { kind: 'seller-suspend'; id: string }
  | { kind: 'product-changes'; id: string }
  | { kind: 'order-cancel' }
  | { kind: 'order-replace'; bidId: string };
type ProductModerationAction = 'APPROVED' | 'CHANGES_REQUESTED';
type ModerationTab = 'authors' | 'works' | 'orders' | 'users';
type ModerationFilter =
  | 'ALL'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUESTED';

export function AdminModerationScreen() {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [moderationTab, setModerationTab] = useState<ModerationTab>('authors');
  const [moderationFilter, setModerationFilter] =
    useState<ModerationFilter>('PENDING_REVIEW');
  const [moderationSearch, setModerationSearch] = useState('');
  const sellers = useQuery({
    queryKey: ['admin', 'seller-profiles'],
    queryFn: () => api.admin.listSellerProfiles(),
    enabled: moderationTab === 'authors',
  });
  const products = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.admin.listProducts(),
    enabled: moderationTab === 'works',
  });
  const [orderPublicId, setOrderPublicId] = useState('');
  const [cancelReason, setCancelReason] = useState<
    'BUYER_DECLINED' | 'BUYER_UNREACHABLE' | 'ADMIN_CANCELLED'
  >('BUYER_DECLINED');
  const [cancelledOrder, setCancelledOrder] = useState<{
    publicId: string;
    listingId: string;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [productAction, setProductAction] =
    useState<ProductModerationAction | null>(null);
  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ['admin', 'seller-profiles'],
    });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  };
  const sellerStatus = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'APPROVED' | 'SUSPENDED';
      reason?: string;
    }) => api.admin.updateSellerStatus(id, { status, reason }),
    onSuccess: () => {
      refresh();
      setProductAction(null);
      setConfirmation(null);
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
    }: {
      id: string;
      status: 'APPROVED' | 'CHANGES_REQUESTED';
      reason?: string;
    }) => api.admin.updateProductStatus(id, { status, reason }),
    onSuccess: () => {
      refresh();
      setConfirmation(null);
    },
  });
  const cancelOrder = useMutation({
    mutationFn: () =>
      api.admin.cancelOrder(orderPublicId, { reason: cancelReason }),
    onSuccess: (data) => {
      setCancelledOrder({
        publicId: data.order.publicId,
        listingId: data.order.listingId,
      });
      setConfirmation(null);
    },
  });
  const rankedBids = useQuery({
    queryKey: ['admin', 'ranked-bids', cancelledOrder?.listingId],
    queryFn: () => api.admin.listRankedBids(cancelledOrder!.listingId),
    enabled: Boolean(cancelledOrder),
  });
  const replaceOrder = useMutation({
    mutationFn: (bidId: string) =>
      api.admin.replaceOrder(cancelledOrder!.publicId, { bidId }),
    onSuccess: () => {
      setCancelledOrder(null);
      setOrderPublicId('');
      setConfirmation(null);
    },
  });
  const confirming =
    sellerStatus.isPending ||
    productStatus.isPending ||
    cancelOrder.isPending ||
    replaceOrder.isPending;

  const activeModerationQuery =
    moderationTab === 'authors'
      ? sellers
      : moderationTab === 'works'
        ? products
        : null;

  if (activeModerationQuery?.isLoading)
    return (
      <FormPageShell>
        <PageState title="Загружаем модерацию…" loading />
      </FormPageShell>
    );
  if (
    activeModerationQuery?.isError ||
    (moderationTab === 'authors' && !sellers.data) ||
    (moderationTab === 'works' && !products.data)
  )
    return (
      <FormPageShell>
        <PageState
          title="Не удалось загрузить модерацию"
          retry={() => {
            void activeModerationQuery?.refetch();
          }}
        />
      </FormPageShell>
    );

  const confirm = () => {
    if (!confirmation) return;
    if (confirmation.kind === 'seller-suspend')
      sellerStatus.mutate({
        id: confirmation.id,
        status: 'SUSPENDED',
        reason: moderationReason.trim(),
      });
    if (confirmation.kind === 'product-changes')
      mutateProductStatus({
        id: confirmation.id,
        status: 'CHANGES_REQUESTED',
        reason: moderationReason.trim(),
      });
    if (confirmation.kind === 'order-cancel') cancelOrder.mutate();
    if (confirmation.kind === 'order-replace')
      replaceOrder.mutate(confirmation.bidId);
  };
  const search = moderationSearch.trim().toLocaleLowerCase();
  const visibleSellers = sellers.data?.sellerProfiles.filter((seller) => {
    const matchesFilter =
      moderationFilter === 'ALL' || seller.status === moderationFilter;
    const matchesSearch =
      !search ||
      `${seller.fullName} ${seller.slug} ${seller.discipline}`
        .toLocaleLowerCase()
        .includes(search);
    return matchesFilter && matchesSearch;
  });
  const visibleProducts = products.data?.products.filter((product) => {
    const matchesFilter =
      moderationFilter === 'ALL' || product.status === moderationFilter;
    const matchesSearch =
      !search ||
      `${product.title ?? ''} ${product.sellerProfile.fullName} ${product.sellerProfile.slug}`
        .toLocaleLowerCase()
        .includes(search);
    return matchesFilter && matchesSearch;
  });
  const confirmationText: Record<
    Confirmation['kind'],
    { title: string; description: string; label: string }
  > = {
    'seller-suspend': {
      title: 'Приостановить продавца?',
      description:
        'Продавец потеряет возможность работать с профилем в текущем статусе.',
      label: 'Приостановить',
    },
    'product-changes': {
      title: 'Запросить изменения по предмету?',
      description:
        'Предмет будет снят с публикации. Автор сможет внести правки и повторно отправить его на модерацию.',
      label: 'Запросить изменения',
    },
    'order-cancel': {
      title: 'Отменить заказ?',
      description:
        'Текущий покупатель потеряет активный заказ. Затем можно выбрать следующую принятую ставку.',
      label: 'Отменить заказ',
    },
    'order-replace': {
      title: 'Создать новый заказ?',
      description: 'Выбранная ставка станет новым активным заказом.',
      label: 'Создать новый заказ',
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
            label="Заказы"
            onPress={() => {
              setModerationTab('orders');
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
            {visibleSellers?.map((seller: SellerProfile) => (
              <ModerationCard
                key={seller.id}
                title={seller.fullName}
                status={presentEnum(
                  seller.status,
                  sellerStatusLabels,
                  'Неизвестный статус продавца',
                )}
              >
                <AppText role="bodySmall" tone="secondary">
                  {presentEnum(
                    seller.sellerType,
                    sellerTypeLabels,
                    'Неизвестный тип продавца',
                  )}{' '}
                  · {seller.slug} · {seller.country}
                </AppText>
                <AppText role="bodySmall" tone="secondary">
                  {seller.shortDescription}
                </AppText>
                {seller.lastModerationReason ? (
                  <AppText role="bodySmall" tone="secondary">
                    Последняя причина: {seller.lastModerationReason}
                  </AppText>
                ) : null}
                {seller.status === 'PENDING_REVIEW' ? (
                  <PrimaryButton
                    compact
                    label="Одобрить"
                    loading={sellerStatus.isPending}
                    onPress={() =>
                      sellerStatus.mutate({ id: seller.id, status: 'APPROVED' })
                    }
                  />
                ) : null}
                <DestructiveButton
                  compact
                  disabled={
                    seller.status === 'SUSPENDED' || seller.hasBlockingListing
                  }
                  label="Приостановить"
                  loading={sellerStatus.isPending}
                  onPress={() =>
                    openConfirmation({ kind: 'seller-suspend', id: seller.id })
                  }
                />
                {seller.hasBlockingListing ? (
                  <AppText role="bodySmall" tone="secondary">
                    Запланированный или активный лот: приостановка продавца
                    недоступна до завершения торгов.
                  </AppText>
                ) : null}
              </ModerationCard>
            ))}
            {visibleSellers?.length === 0 ? (
              <AppText role="bodySmall" tone="secondary">
                Нет авторов по текущему фильтру
              </AppText>
            ) : null}
            {sellerStatus.isError ? (
              <AppText role="bodySmall" tone="danger">
                Не удалось приостановить продавца. Проверьте причину и состояние
                активных торгов.
              </AppText>
            ) : null}
          </FormSection>
        </View>
      ) : null}
      {moderationTab === 'works' ? (
        <View style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <FormSection title="Работы">
            {visibleProducts?.map((product: AdminProduct) => {
              const productSellerApproved =
                product.sellerProfile.status === 'APPROVED';

              return (
                <ModerationCard
                  key={product.id}
                  title={product.title ?? 'Без названия'}
                  status={presentEnum(
                    product.status,
                    productStatusLabels,
                    'Неизвестный статус предмета',
                  )}
                >
                  {product.images[0] ? (
                    <ResilientRemoteImage
                      uri={getApiAssetUrl(product.images[0].url)}
                      component="ProductGallery"
                      accessibilityLabel={`Предмет: ${product.title ?? 'Без названия'}`}
                      fallbackLabel={`Изображение недоступно: ${product.title ?? 'Без названия'}`}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: designTokens.radius.image,
                      }}
                      contentFit="contain"
                    />
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
                    {product.city ?? 'Город не указан'} ·{' '}
                    {product.story ?? 'Описание не указано'}
                  </AppText>
                  <AppText role="bodySmall" tone="secondary">
                    Изображений: {product.images.length} · Этапов создания:{' '}
                    {product.creationSteps.length}
                  </AppText>
                  {product.creationIntro ? (
                    <AppText role="bodySmall" tone="secondary">
                      История создания: {product.creationIntro}
                    </AppText>
                  ) : (
                    <AppText role="bodySmall" tone="secondary">
                      История создания не добавлена — это необязательный раздел.
                    </AppText>
                  )}
                  {product.creationSteps.map((step) => (
                    <View key={step.id} style={{ gap: designTokens.space.x1 }}>
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
                  {product.status === 'PENDING_REVIEW' ? (
                    <PrimaryButton
                      compact
                      label="Одобрить"
                      loading={productStatus.isPending}
                      disabled={!productSellerApproved}
                      onPress={() =>
                        mutateProductStatus({
                          id: product.id,
                          status: 'APPROVED',
                        })
                      }
                    />
                  ) : null}
                  {product.status === 'PENDING_REVIEW' &&
                  !productSellerApproved ? (
                    <AppText role="bodySmall" tone="secondary">
                      Сначала одобрите автора.
                    </AppText>
                  ) : null}
                  <DestructiveButton
                    compact
                    disabled={
                      !['APPROVED', 'PENDING_REVIEW'].includes(
                        product.status,
                      ) || product.hasBlockingListing
                    }
                    label="Запросить изменения"
                    loading={productStatus.isPending}
                    onPress={() =>
                      openConfirmation({
                        kind: 'product-changes',
                        id: product.id,
                      })
                    }
                  />
                </ModerationCard>
              );
            })}
            {visibleProducts?.length === 0 ? (
              <AppText role="bodySmall" tone="secondary">
                Нет работ по текущему фильтру
              </AppText>
            ) : null}
            {productStatus.isError ? (
              <AppText role="bodySmall" tone="danger">
                {productAction === 'APPROVED'
                  ? 'Не удалось одобрить предмет. Проверьте, одобрен ли автор и заполнены ли обязательные поля.'
                  : 'Не удалось запросить изменения по предмету. Проверьте причину и состояние активных торгов.'}
              </AppText>
            ) : null}
          </FormSection>
        </View>
      ) : null}
      {moderationTab === 'orders' ? (
        <FormSection title="Отмена и переназначение заказа">
          <AppText role="bodySmall" tone="secondary">
            После внешнего согласования отмените активный заказ и выберите
            следующую принятую ставку. Контакты участников здесь не
            раскрываются.
          </AppText>
          <TextField
            label="Номер заказа"
            value={orderPublicId}
            onChangeText={(value) => {
              setOrderPublicId(value);
              setConfirmation(null);
            }}
            placeholder="ORD-..."
            autoCapitalize="none"
          />
          <AppText role="bodySmall" tone="secondary">
            Причина отмены:{' '}
            {presentEnum(
              cancelReason,
              cancellationReasonLabels,
              'Неизвестная причина отмены',
            )}
          </AppText>
          {(
            ['BUYER_DECLINED', 'BUYER_UNREACHABLE', 'ADMIN_CANCELLED'] as const
          ).map((reason) => (
            <SecondaryButton
              key={reason}
              label={`${cancelReason === reason ? '✓ ' : ''}${presentEnum(
                reason,
                cancellationReasonLabels,
                'Неизвестная причина отмены',
              )}`}
              onPress={() => setCancelReason(reason)}
            />
          ))}
          <DestructiveButton
            label="Отменить заказ"
            disabled={!orderPublicId}
            onPress={() => setConfirmation({ kind: 'order-cancel' })}
          />
          {cancelOrder.isError ? (
            <AppText role="bodySmall" tone="danger">
              Не удалось отменить Order. Проверьте номер, статус и полномочия.
            </AppText>
          ) : null}
          {cancelledOrder ? (
            <View style={{ gap: designTokens.space.x2 }}>
              <AppText role="bodySmall" tone="secondary">
                Выберите replacement Bid для Listing {cancelledOrder.listingId}.
              </AppText>
              {rankedBids.isLoading ? (
                <AppText role="bodySmall" tone="secondary">
                  Загружаем принятые ставки…
                </AppText>
              ) : null}
              {rankedBids.isError ? (
                <SecondaryButton
                  label="Повторить загрузку ставок"
                  onPress={() => void rankedBids.refetch()}
                />
              ) : null}
              {rankedBids.data?.bids.map((bid: RankedBid) => (
                <SecondaryButton
                  key={bid.id}
                  label={`Назначить ${bid.bidderAlias}: ${bid.amount} BYN`}
                  loading={replaceOrder.isPending}
                  onPress={() =>
                    setConfirmation({ kind: 'order-replace', bidId: bid.id })
                  }
                />
              ))}
              {replaceOrder.isError ? (
                <AppText role="bodySmall" tone="danger">
                  Не удалось создать replacement Order. Проверьте статус и
                  повторите попытку.
                </AppText>
              ) : null}
            </View>
          ) : null}
        </FormSection>
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
          confirmation.kind === 'product-changes' ? (
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
            disabled={
              (confirmation.kind === 'seller-suspend' ||
                confirmation.kind === 'product-changes') &&
              !moderationReason.trim()
            }
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
