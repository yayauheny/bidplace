import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import type { ApiClient } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppDialog,
  AppText,
  AuctionPlayer,
  BottomActionBar,
  EditorialSection,
  PageState,
  PrimaryButton,
  ProductGallery,
  ProductTabs,
  type ProductTabId,
  SecondaryButton,
  Separator,
  TextField,
  MotionPressable,
} from '../../components/modern-ui';
import { formatCurrencyAmount, formatDateTime } from '../../lib/formatters';
import { getApiAssetUrl } from '../../lib/environment';
import { useListingRealtime } from '../../lib/use-listing-realtime';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { EmailRulesGate } from '../auth/email-rules-gate';
import { validateBidAmount } from './bid-validation';

type BidItem = Awaited<
  ReturnType<ApiClient['listings']['listBids']>
>['bids'][number];
type BidAttempt = { listingId: string; amount: number; idempotencyKey: string };
type ListingStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | 'DRAFT';
type DetailItem = { label: string; value: string };

function newIdempotencyKey(): string {
  if (!globalThis.crypto?.randomUUID)
    throw new Error('Secure idempotency keys are unavailable on this device');
  return globalThis.crypto.randomUUID();
}

function formatRemainingTime(endsAt: string, now: number): string {
  const seconds = Math.max(
    0,
    Math.ceil((new Date(endsAt).getTime() - now) / 1_000),
  );
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainder = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
}

function listingStatusLabel(status: ListingStatus): string {
  return {
    SCHEDULED: 'Торги запланированы',
    LIVE: 'Торги идут',
    ENDED: 'Торги завершены',
    CANCELLED: 'Размещение отменено',
    DRAFT: 'Черновик размещения',
  }[status];
}

function listingStatusTone(
  status: ListingStatus,
): 'accent' | 'success' | 'secondary' | 'danger' {
  if (status === 'LIVE') return 'success';
  if (status === 'SCHEDULED') return 'accent';
  if (status === 'CANCELLED') return 'danger';
  return 'secondary';
}

function participationLabel(status: string): string {
  return (
    {
      LEADING: 'Побеждаете',
      WON: 'Выиграли',
      OUTBID: 'Ставка перебита',
      LOST: 'Торги завершены',
      PENDING: 'Участвуете',
    }[status] ?? 'Участвуете'
  );
}

function participationTone(
  status: string,
): 'accent' | 'success' | 'secondary' | 'danger' {
  if (status === 'LEADING' || status === 'WON') return 'success';
  if (status === 'OUTBID') return 'accent';
  return 'secondary';
}

function SurfacePanel({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        gap: designTokens.space.x4,
        borderRadius: designTokens.radius.panel,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        backgroundColor: designTokens.color.surface,
        padding: designTokens.space.x5,
      }}
    >
      {eyebrow ? (
        <AppText role="metadata" tone="secondary">
          {eyebrow}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

function BidForm({
  amount,
  minimumNextBid,
  validationError,
  isPending,
  hasFailedAttempt,
  onAmountChange,
  onSubmit,
  onRetry,
  showPrimaryAction = true,
}: {
  amount: string;
  minimumNextBid: number | null;
  validationError: string | null;
  isPending: boolean;
  hasFailedAttempt: boolean;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  showPrimaryAction?: boolean;
}) {
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <TextField
        label="Ваша ставка, BYN"
        value={amount}
        onChangeText={onAmountChange}
        keyboardType="decimal-pad"
        placeholder={
          minimumNextBid !== null ? `от ${minimumNextBid}` : undefined
        }
        error={validationError ?? undefined}
      />
      {showPrimaryAction ? (
        <PrimaryButton
          label="Сделать ставку"
          loading={isPending}
          onPress={onSubmit}
          accessibilityHint="Сервер проверит актуальную цену и условия торгов"
        />
      ) : null}
      {hasFailedAttempt ? (
        <SecondaryButton
          label="Повторить ставку"
          disabled={isPending}
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

function ProductShell({
  children,
  bottomAction,
}: {
  children: React.ReactNode;
  bottomAction?: React.ReactNode;
}) {
  return <AppShell bottomAction={bottomAction}>{children}</AppShell>;
}

function ProductAtmosphere({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) return null;

  return (
    <View
      aria-hidden
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
    >
      <Image
        source={{ uri: getApiAssetUrl(imageUrl) }}
        contentFit="cover"
        blurRadius={64}
        style={[
          StyleSheet.absoluteFill,
          { opacity: 0.18, transform: [{ scale: 1.15 }] },
        ]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(250, 250, 248, 0.78)' },
        ]}
      />
    </View>
  );
}

export function ProductScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= designTokens.breakpoint.desktopShell;
  const isProductWide = width >= designTokens.breakpoint.productDetailWide;
  const isHeroThreeColumn =
    width >= designTokens.breakpoint.productHeroThreeColumn;
  const [activeTab, setActiveTab] = useState<ProductTabId>('about');
  const [amount, setAmount] = useState('');
  const [pendingAttempt, setPendingAttempt] = useState<BidAttempt | null>(null);
  const [confirmationAttempt, setConfirmationAttempt] =
    useState<BidAttempt | null>(null);
  const [bidValidationError, setBidValidationError] = useState<string | null>(
    null,
  );
  const [now, setNow] = useState(Date.now());

  const query = useQuery({
    queryKey: ['products', publicId],
    queryFn: () => api.products.get(publicId),
  });
  const listingId = query.data?.listing?.id;
  const bids = useQuery({
    queryKey: ['listings', listingId, 'bids'],
    queryFn: () => api.listings.listBids(listingId!),
    enabled: Boolean(listingId),
  });
  const activity = useQuery({
    queryKey: ['user', 'activity'],
    queryFn: () => api.activity.get(),
    enabled: auth.isAuthenticated && !auth.isAdmin,
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const refreshListing = () => {
    void queryClient.invalidateQueries({ queryKey: ['products', publicId] });
    if (listingId)
      void queryClient.invalidateQueries({
        queryKey: ['listings', listingId, 'bids'],
      });
    if (auth.isAuthenticated && !auth.isAdmin)
      void queryClient.invalidateQueries({ queryKey: ['user', 'activity'] });
  };
  useListingRealtime(listingId, refreshListing);
  const bid = useMutation({
    mutationFn: (attempt: BidAttempt) =>
      api.listings.placeBid(
        attempt.listingId,
        { amount: attempt.amount },
        attempt.idempotencyKey,
      ),
    onSuccess: () => {
      setPendingAttempt(null);
      setBidValidationError(null);
      refreshListing();
    },
    onError: () => {
      refreshListing();
    },
  });

  if (query.isLoading)
    return (
      <ProductShell>
        <PageState title="Загружаем предмет…" loading />
      </ProductShell>
    );
  if (query.isError || !query.data)
    return (
      <ProductShell>
        <PageState
          title="Не удалось загрузить предмет"
          retry={() => void query.refetch()}
        />
      </ProductShell>
    );

  const { product, sellerProfile, listing, minimumNextBid } = query.data;
  const participation = listing
    ? activity.data?.activity.find((item) => item.listing.id === listing.id)
    : undefined;
  const detailItems: DetailItem[] = [
    product.technique ? { label: 'Техника', value: product.technique } : null,
    product.materials ? { label: 'Материал', value: product.materials } : null,
    product.dimensions ? { label: 'Размеры', value: product.dimensions } : null,
    product.year
      ? { label: 'Год создания', value: String(product.year) }
      : null,
    product.condition ? { label: 'Состояние', value: product.condition } : null,
    product.uniqueness
      ? { label: 'Уникальность', value: product.uniqueness }
      : null,
    product.city ? { label: 'Город', value: product.city } : null,
    product.deliveryInfo
      ? { label: 'Передача', value: product.deliveryInfo }
      : null,
  ].filter((item): item is DetailItem => item !== null);

  const sendBid = (attempt: BidAttempt) => {
    setPendingAttempt(attempt);
    setConfirmationAttempt(null);
    bid.mutate(attempt);
  };
  const submitBid = () => {
    if (!listing) return;
    const error = validateBidAmount(amount, minimumNextBid);
    if (error) {
      setBidValidationError(error);
      return;
    }
    setBidValidationError(null);
    const nextAmount = Number(amount.replace(',', '.'));
    const reusable =
      pendingAttempt &&
      pendingAttempt.listingId === listing.id &&
      pendingAttempt.amount === nextAmount
        ? pendingAttempt
        : {
            listingId: listing.id,
            amount: nextAmount,
            idempotencyKey: newIdempotencyKey(),
          };
    if (!participation) {
      setConfirmationAttempt(reusable);
      return;
    }
    sendBid(reusable);
  };

  const bidForm =
    listing?.status === 'LIVE' && !auth.isAdmin ? (
      <EmailRulesGate redirectTo={`/product/${publicId}`}>
        <BidForm
          amount={amount}
          minimumNextBid={minimumNextBid}
          validationError={
            bidValidationError ??
            (bid.isError
              ? 'Ставка не принята. Сервер обновил цену и минимальную сумму — проверьте актуальные данные.'
              : null)
          }
          isPending={bid.isPending}
          hasFailedAttempt={bid.isError && pendingAttempt !== null}
          onAmountChange={setAmount}
          onSubmit={submitBid}
          onRetry={() => {
            if (pendingAttempt) sendBid(pendingAttempt);
          }}
          showPrimaryAction={isProductWide}
        />
      </EmailRulesGate>
    ) : null;
  const adminBidNotice =
    listing?.status === 'LIVE' && auth.isAdmin ? (
      <AppText role="bodySmall" tone="secondary">
        Администратор не участвует в торгах.
      </AppText>
    ) : null;
  const auctionPlayer = listing ? (
    <AuctionPlayer
      statusLabel={listingStatusLabel(listing.status)}
      statusTone={listingStatusTone(listing.status)}
      participationLabel={
        participation ? participationLabel(participation.status) : undefined
      }
      participationTone={
        participation ? participationTone(participation.status) : undefined
      }
      currentPriceLabel={formatCurrencyAmount(listing.currentPrice)}
      startPriceLabel={formatCurrencyAmount(listing.auctionRules.startPrice)}
      minimumNextBidLabel={
        minimumNextBid === null
          ? undefined
          : formatCurrencyAmount(minimumNextBid)
      }
      timingLabel={
        listing.status === 'LIVE'
          ? `До завершения: ${formatRemainingTime(listing.endsAt, now)}`
          : listing.status === 'SCHEDULED'
            ? `Начало: ${formatDateTime(listing.startsAt)}`
            : 'Торги завершены'
      }
      deadlineLabel={`Окончание: ${formatDateTime(listing.endsAt)}`}
    >
      {bidForm ?? adminBidNotice}
    </AuctionPlayer>
  ) : (
    <SurfacePanel>
      <AppText role="bodySmall" tone="secondary">
        Сейчас нет активного размещения.
      </AppText>
    </SurfacePanel>
  );
  const itemStory = (
    <EditorialSection title="О предмете">
      <View style={{ gap: designTokens.space.x3 }}>
        {product.story ? <AppText role="body">{product.story}</AppText> : null}
        {product.provenance ? (
          <>
            <Separator />
            <View style={{ gap: designTokens.space.x1 }}>
              <AppText role="label">Происхождение</AppText>
              <AppText role="bodySmall" tone="secondary">
                {product.provenance}
              </AppText>
            </View>
          </>
        ) : null}
        {detailItems.map((item) => (
          <View
            key={item.label}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: designTokens.space.x4,
            }}
          >
            <AppText role="bodySmall" tone="secondary">
              {item.label}
            </AppText>
            <AppText
              role="bodySmall"
              style={{ flexShrink: 1, textAlign: 'right' }}
            >
              {item.value}
            </AppText>
          </View>
        ))}
        {!product.story && !product.provenance && detailItems.length === 0 ? (
          <AppText role="bodySmall" tone="secondary">
            Описание предмета появится здесь.
          </AppText>
        ) : null}
      </View>
    </EditorialSection>
  );
  const bidHistory = (
    <EditorialSection title="История ставок">
      {bids.isLoading ? (
        <AppText role="bodySmall" tone="secondary">
          Загружаем историю ставок…
        </AppText>
      ) : bids.isError ? (
        <View style={{ gap: designTokens.space.x3 }}>
          <AppText role="bodySmall" tone="secondary">
            Не удалось загрузить историю ставок.
          </AppText>
          <SecondaryButton
            label="Повторить"
            onPress={() => void bids.refetch()}
          />
        </View>
      ) : bids.data?.bids?.length ? (
        <View>
          <View
            style={{
              flexDirection: 'row',
              gap: designTokens.space.x3,
              borderBottomWidth: 1,
              borderBottomColor: designTokens.color.border,
              paddingBottom: designTokens.space.x3,
            }}
          >
            <AppText role="metadata" tone="secondary" style={{ flex: 1 }}>
              Участник
            </AppText>
            <AppText
              role="metadata"
              tone="secondary"
              style={{ width: 120, textAlign: 'right' }}
            >
              Ставка
            </AppText>
            {isProductWide ? (
              <AppText
                role="metadata"
                tone="secondary"
                style={{ width: 180, textAlign: 'right' }}
              >
                Время
              </AppText>
            ) : null}
          </View>
          {bids.data.bids.map((item: BidItem) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: designTokens.space.x3,
                borderBottomWidth: 1,
                borderBottomColor: designTokens.color.border,
                paddingVertical: designTokens.space.x3,
              }}
            >
              <AppText role="bodySmall" tone="secondary" style={{ flex: 1 }}>
                {item.bidderAlias}
              </AppText>
              <AppText
                role="numeric"
                style={{ width: 120, textAlign: 'right' }}
              >
                {formatCurrencyAmount(item.amount)}
              </AppText>
              {isProductWide ? (
                <AppText
                  role="bodySmall"
                  tone="secondary"
                  style={{ width: 180, textAlign: 'right' }}
                >
                  {formatDateTime(item.createdAt)}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <AppText role="bodySmall" tone="secondary">
          Ставок ещё нет.
        </AppText>
      )}
    </EditorialSection>
  );
  const itemHistory = (
    <EditorialSection title="История предмета">
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="bodySmall">Автор: {sellerProfile.fullName}</AppText>
        {product.year ? (
          <AppText role="bodySmall" tone="secondary">
            Год создания: {product.year}
          </AppText>
        ) : null}
        {product.publishedAt ? (
          <AppText role="bodySmall" tone="secondary">
            Размещено на bidplace: {formatDateTime(product.publishedAt)}
          </AppText>
        ) : null}
        {listing ? (
          <AppText role="bodySmall" tone="secondary">
            Состояние торгов: {listingStatusLabel(listing.status)}
          </AppText>
        ) : (
          <AppText role="bodySmall" tone="secondary">
            Размещение готовится.
          </AppText>
        )}
      </View>
    </EditorialSection>
  );

  return (
    <ProductShell
      bottomAction={
        !isProductWide && bidForm ? (
          <BottomActionBar
            summary={
              <View style={{ gap: designTokens.space.x1 }}>
                <AppText role="metadata" tone="secondary">
                  Минимальная ставка
                </AppText>
                <AppText role="numeric">
                  {minimumNextBid === null
                    ? 'Недоступна'
                    : formatCurrencyAmount(minimumNextBid)}
                </AppText>
              </View>
            }
          >
            <EmailRulesGate redirectTo={`/product/${publicId}`}>
              <PrimaryButton
                compact
                label="Сделать ставку"
                loading={bid.isPending}
                onPress={submitBid}
                accessibilityHint="Сервер проверит актуальную цену и условия торгов"
              />
            </EmailRulesGate>
          </BottomActionBar>
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop
            ? designTokens.space.x8
            : designTokens.space.x5,
          paddingVertical: designTokens.space.x6,
          paddingBottom:
            !isProductWide && bidForm
              ? designTokens.space.x16
              : designTokens.space.x8,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.productDetailMaxWidth,
            alignSelf: 'center',
            gap: designTokens.space.x6,
          }}
        >
          <View
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: designTokens.radius.sheet,
              backgroundColor: designTokens.color.surfaceWarm,
              padding: isDesktop
                ? designTokens.space.x8
                : designTokens.space.x4,
            }}
          >
            <ProductAtmosphere imageUrl={product.images[0]?.url} />
            <View
              style={{
                position: 'relative',
                flexDirection: isHeroThreeColumn ? 'row' : 'column',
                alignItems: isHeroThreeColumn ? 'center' : 'stretch',
                gap: isDesktop ? designTokens.space.x8 : designTokens.space.x6,
              }}
            >
              <View
                style={{
                  width: isHeroThreeColumn ? 260 : '100%',
                  minWidth: 0,
                  gap: designTokens.space.x3,
                }}
              >
                <AppText role={isDesktop ? 'display' : 'screenTitle'}>
                  {product.title ?? 'Предмет'}
                </AppText>
                <Link
                  href={
                    {
                      pathname: '/seller/[slug]',
                      params: { slug: sellerProfile.slug },
                    } as Href
                  }
                  asChild
                >
                  <MotionPressable
                    accessibilityRole="link"
                    accessibilityLabel={`Открыть профиль автора ${sellerProfile.fullName}`}
                    onPress={() => undefined}
                    style={{
                      alignSelf: 'flex-start',
                      minHeight: designTokens.size.touch,
                      justifyContent: 'center',
                    }}
                  >
                    <AppText
                      role="label"
                      style={{ textDecorationLine: 'underline' }}
                    >
                      {sellerProfile.fullName}
                    </AppText>
                  </MotionPressable>
                </Link>
                {product.story ? (
                  <AppText role="bodySmall" tone="secondary" numberOfLines={4}>
                    {product.story}
                  </AppText>
                ) : null}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <ProductGallery
                  images={product.images}
                  label={product.title ?? 'Предмет'}
                />
              </View>
              <View
                style={{
                  width: isHeroThreeColumn ? 320 : '100%',
                  maxWidth: '100%',
                }}
              >
                {auctionPlayer}
              </View>
            </View>
          </View>
          <View style={{ gap: designTokens.space.x6 }}>
            <ProductTabs
              activeTab={activeTab}
              bidCount={bids.data?.bids.length}
              onChange={setActiveTab}
            />
            <View
              nativeID={`product-panel-${activeTab}`}
              role="tabpanel"
              accessibilityLabelledBy={`product-tab-${activeTab}`}
            >
              {activeTab === 'about'
                ? itemStory
                : activeTab === 'creation'
                  ? itemHistory
                  : bidHistory}
            </View>
            {participation?.orderPublicId ? (
              <Link
                href={{
                  pathname: '/order/[publicId]',
                  params: { publicId: participation.orderPublicId },
                }}
                asChild
              >
                <SecondaryButton
                  label="Открыть результат заказа"
                  onPress={() => undefined}
                />
              </Link>
            ) : null}
          </View>
        </View>
      </ScrollView>
      <AppDialog
        open={confirmationAttempt !== null}
        title="Подтвердите ставку"
        description={
          listing
            ? `Вы делаете ставку на «${product.title ?? 'предмет'}» на сумму ${formatCurrencyAmount(confirmationAttempt?.amount ?? 0)}. Минимальная сумма по данным сервера: ${minimumNextBid === null ? 'недоступна' : formatCurrencyAmount(minimumNextBid)}. Торги завершаются ${formatDateTime(listing.endsAt)}. Ставка необратима.`
            : undefined
        }
        onClose={() => setConfirmationAttempt(null)}
      >
        <PrimaryButton
          label="Подтвердить ставку"
          loading={bid.isPending}
          onPress={() => {
            if (confirmationAttempt) sendBid(confirmationAttempt);
          }}
        />
        <SecondaryButton
          label="Отмена"
          disabled={bid.isPending}
          onPress={() => setConfirmationAttempt(null)}
        />
      </AppDialog>
    </ProductShell>
  );
}
