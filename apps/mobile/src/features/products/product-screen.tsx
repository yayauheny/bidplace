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
  AppIcon,
  AppText,
  AuctionCardGrid,
  AuctionPlayer,
  BottomActionBar,
  EditorialSection,
  PageState,
  PrimaryButton,
  ProductGallery,
  ProductTabs,
  ResilientRemoteImage,
  type ProductTabId,
  SecondaryButton,
  Separator,
  TextField,
  MotionPressable,
} from '../../components/ui';
import { formatCurrencyAmount, formatDateTime } from '../../lib/formatters';
import { getApiAssetUrl } from '../../lib/environment';
import { useListingRealtime } from '../../lib/use-listing-realtime';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { EmailRulesGate } from '../auth/email-rules-gate';
import { validateBidAmount } from './bid-validation';
import { getCatalogColumnCount } from './catalog-layout';

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

export function ProductScreen({
  publicId,
  activeTab,
  onTabChange,
}: {
  publicId: string;
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
}) {
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= designTokens.breakpoint.desktopShell;
  const isProductWide = width >= designTokens.breakpoint.productDetailWide;
  const isHeroThreeColumn =
    width >= designTokens.breakpoint.productHeroThreeColumn;
  const isCreationTwoColumn =
    width >= designTokens.breakpoint.catalogFourColumn;
  const productCanvasPadding =
    width >= designTokens.layout.productDetailMaxWidth
      ? 0
      : width >= designTokens.breakpoint.desktopShell
        ? designTokens.layout.tabletGutter
        : designTokens.layout.mobileGutter;
  const [amount, setAmount] = useState('');
  const [pendingAttempt, setPendingAttempt] = useState<BidAttempt | null>(null);
  const [confirmationAttempt, setConfirmationAttempt] =
    useState<BidAttempt | null>(null);
  const [bidValidationError, setBidValidationError] = useState<string | null>(
    null,
  );
  const [openCreationStep, setOpenCreationStep] = useState(0);
  const [now, setNow] = useState(Date.now());

  const query = useQuery({
    queryKey: ['products', publicId],
    queryFn: () => api.products.get(publicId),
  });
  const sellerSlug = query.data?.sellerProfile.slug;
  const relatedWorks = useQuery({
    queryKey: ['public-seller', sellerSlug],
    queryFn: () => api.sellers.getPublicDetail(sellerSlug!),
    enabled: activeTab === 'about' && Boolean(sellerSlug),
    retry: false,
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

  const {
    product,
    sellerProfile,
    listing,
    minimumNextBid,
    creationIntro,
    creationSteps,
  } = query.data;
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
          showPrimaryAction={false}
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
      actionLabel={
        listing.status === 'LIVE' && !auth.isAdmin ? 'Поставить' : undefined
      }
      actionDisabled={bid.isPending}
      actionLoading={bid.isPending}
      onAction={
        listing.status === 'LIVE' && !auth.isAdmin ? submitBid : undefined
      }
      width={isHeroThreeColumn ? 404 : undefined}
    />
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
    <View
      style={{
        width: '100%',
        gap: designTokens.space.x3,
      }}
    >
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
          {bids.data.bids.map((item: BidItem, index) => (
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
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: designTokens.space.x2,
                }}
              >
                <AppText role="bodySmall" tone="secondary">
                  {item.bidderAlias}
                </AppText>
                {index === 0 ? (
                  <View
                    accessibilityLabel="Лидер торгов"
                    style={{
                      borderRadius: designTokens.radius.pill,
                      backgroundColor: designTokens.color.surfaceStrong,
                      paddingHorizontal: designTokens.space.x2,
                      paddingVertical: designTokens.space.x1,
                    }}
                  >
                    <AppText role="metadata">Лидер</AppText>
                  </View>
                ) : null}
              </View>
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
    </View>
  );
  const creationStory = (
    <View style={{ gap: designTokens.space.x6 }}>
      <View style={{ maxWidth: 760, gap: designTokens.space.x2 }}>
        <AppText role="sectionTitle">История создания</AppText>
        {creationIntro ? <AppText role="body">{creationIntro}</AppText> : null}
      </View>
      {creationSteps.length > 0 ? (
        <View
          style={{
            flexDirection: isCreationTwoColumn ? 'row' : 'column',
            gap: isCreationTwoColumn
              ? designTokens.space.x12
              : designTokens.space.x6,
          }}
        >
          <View
            style={{
              flex: isCreationTwoColumn ? 1 : undefined,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: designTokens.space.x4,
            }}
          >
            {creationSteps.map((step) => (
              <View
                key={step.id}
                style={{
                  width: isCreationTwoColumn ? 404 : '100%',
                  gap: designTokens.space.x2,
                }}
              >
                {step.image ? (
                  <ResilientRemoteImage
                    uri={getApiAssetUrl(step.image.url)}
                    component="CreationStep"
                    accessibilityLabel={`Изображение этапа: ${step.title}`}
                    fallbackLabel={`Изображение этапа недоступно: ${step.title}`}
                    style={{
                      width: '100%',
                      height: isCreationTwoColumn ? 457 : undefined,
                      aspectRatio: isCreationTwoColumn ? undefined : 1.2,
                      borderRadius: designTokens.radius.media,
                      backgroundColor: designTokens.color.surfaceMuted,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    accessibilityLabel={`Изображение этапа недоступно: ${step.title}`}
                    style={{
                      width: '100%',
                      height: isCreationTwoColumn ? 457 : 240,
                      borderRadius: designTokens.radius.media,
                      backgroundColor: designTokens.color.surfaceMuted,
                    }}
                  />
                )}
              </View>
            ))}
          </View>
          <View
            style={{
              width: isCreationTwoColumn ? 424 : '100%',
              gap: 0,
            }}
          >
            {creationSteps.map((step, index) => {
              const expanded = index === openCreationStep;
              return (
                <View
                  key={step.id}
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: designTokens.color.border,
                  }}
                >
                  <MotionPressable
                    accessibilityRole="button"
                    accessibilityLabel={`${String(index + 1).padStart(2, '0')} ${step.title}`}
                    accessibilityState={{ expanded }}
                    onPress={() => setOpenCreationStep(expanded ? -1 : index)}
                    preset="button"
                    style={{
                      minHeight: 64,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: designTokens.space.x3,
                    }}
                  >
                    <AppText
                      role="metadata"
                      tone="secondary"
                      style={{ width: 24 }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </AppText>
                    <AppText role="label" style={{ flex: 1 }}>
                      {step.title}
                    </AppText>
                    <AppIcon name={expanded ? 'minus' : 'plus'} size={16} />
                  </MotionPressable>
                  {expanded ? (
                    <View
                      style={{
                        gap: designTokens.space.x3,
                        paddingLeft: designTokens.space.x8,
                        paddingBottom: designTokens.space.x5,
                      }}
                    >
                      <AppText role="body" style={{ fontWeight: '600' }}>
                        {step.body}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              );
            })}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: designTokens.color.border,
              }}
            />
          </View>
        </View>
      ) : creationIntro ? null : (
        <AppText role="bodySmall" tone="secondary">
          История создания появится здесь.
        </AppText>
      )}
    </View>
  );
  const relatedItems =
    relatedWorks.data?.products
      .filter((item) => item.product.publicId !== product.publicId)
      .slice(0, 4) ?? [];
  const relatedWorksSection = relatedWorks.isLoading ? (
    <EditorialSection title="Другие работы автора">
      <AppText role="bodySmall" tone="secondary">
        Загружаем работы…
      </AppText>
    </EditorialSection>
  ) : relatedWorks.isError ? (
    <EditorialSection title="Другие работы автора">
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="bodySmall" tone="secondary">
          Не удалось загрузить другие работы.
        </AppText>
        <SecondaryButton
          label="Повторить"
          onPress={() => void relatedWorks.refetch()}
        />
      </View>
    </EditorialSection>
  ) : relatedItems.length > 0 ? (
    <EditorialSection title={`Другие работы ${sellerProfile.fullName}`}>
      <AuctionCardGrid
        items={relatedItems}
        columns={getCatalogColumnCount(width)}
      />
    </EditorialSection>
  ) : null;

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
          paddingVertical: designTokens.space.x6,
          paddingBottom:
            !isProductWide && bidForm
              ? designTokens.space.x16
              : designTokens.space.x8,
        }}
        style={{ backgroundColor: designTokens.color.surfaceWarm }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.productDetailMaxWidth,
            alignSelf: 'center',
          }}
        >
          {activeTab === 'about' ? (
            <View
              style={{
                position: 'relative',
                minHeight: isHeroThreeColumn ? 676 : undefined,
                paddingHorizontal: productCanvasPadding,
                paddingTop: isDesktop
                  ? designTokens.space.x3
                  : designTokens.space.x6,
                paddingBottom: isDesktop
                  ? designTokens.space.x12
                  : designTokens.space.x8,
              }}
            >
              <ProductAtmosphere imageUrl={product.images[0]?.url} />
              <View
                style={{
                  position: 'relative',
                  width: isHeroThreeColumn
                    ? designTokens.layout.productHeroContentWidth
                    : '100%',
                  alignSelf: isHeroThreeColumn ? 'flex-start' : 'stretch',
                  flexDirection: isHeroThreeColumn ? 'row' : 'column',
                  alignItems: isHeroThreeColumn ? 'flex-start' : 'stretch',
                  justifyContent: isHeroThreeColumn
                    ? 'space-between'
                    : 'flex-start',
                  gap: isDesktop
                    ? designTokens.space.x8
                    : designTokens.space.x6,
                }}
              >
                <View
                  style={{
                    width: isHeroThreeColumn ? 328 : '100%',
                    minWidth: 0,
                    paddingTop: isHeroThreeColumn ? 165 : 0,
                    gap: designTokens.space.x5,
                  }}
                >
                  <AppText
                    role={isDesktop ? 'display' : 'screenTitle'}
                    style={
                      isDesktop
                        ? {
                            fontFamily: 'Onest_700Bold',
                            fontSize: 48,
                            lineHeight: 50,
                            letterSpacing: -1.2,
                          }
                        : undefined
                    }
                  >
                    {product.title ?? 'Предмет'}
                  </AppText>
                  {product.story ? (
                    <AppText role="body" tone="secondary" numberOfLines={5}>
                      {product.story}
                    </AppText>
                  ) : null}
                </View>
                <View
                  style={{
                    width: isHeroThreeColumn ? 420 : '100%',
                    minWidth: 0,
                    alignItems: isHeroThreeColumn ? 'center' : 'stretch',
                    gap: designTokens.space.x8,
                  }}
                >
                  <ProductGallery
                    images={product.images}
                    label={product.title ?? 'Предмет'}
                  />
                  {auctionPlayer}
                  {isProductWide ? (bidForm ?? adminBidNotice) : bidForm}
                </View>
                <View
                  style={{
                    width: isHeroThreeColumn ? 312 : '100%',
                    maxWidth: '100%',
                    paddingTop: isHeroThreeColumn ? 102 : 0,
                    gap: designTokens.space.x5,
                  }}
                >
                  {detailItems.length > 0 ? (
                    <View style={{ gap: designTokens.space.x4 }}>
                      {detailItems.map((item) => (
                        <View
                          key={item.label}
                          style={{ gap: designTokens.space.x1 }}
                        >
                          <AppText role="caption" tone="secondary">
                            {item.label}
                          </AppText>
                          <AppText role="label">{item.value}</AppText>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <View style={{ gap: designTokens.space.x2 }}>
                    <AppText role="caption" tone="secondary">
                      Автор
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
                          minHeight: designTokens.size.touch,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: designTokens.space.x2,
                        }}
                      >
                        <ResilientRemoteImage
                          uri={getApiAssetUrl(sellerProfile.profilePhotoUrl)}
                          component="ProductAuthor"
                          accessibilityLabel={`Фото автора: ${sellerProfile.fullName}`}
                          fallbackLabel={`Фото автора недоступно: ${sellerProfile.fullName}`}
                          style={{ width: 32, height: 32, borderRadius: 16 }}
                          contentFit="cover"
                        />
                        <AppText role="label">@{sellerProfile.slug}</AppText>
                        <AppIcon name="chevronRight" size={16} />
                      </MotionPressable>
                    </Link>
                  </View>
                  <MotionPressable
                    accessibilityRole="button"
                    accessibilityLabel="Поделиться предметом"
                    onPress={() => undefined}
                    preset="button"
                    style={{
                      height: 36,
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: designTokens.space.x2,
                      borderWidth: 1,
                      borderColor: designTokens.color.border,
                      borderRadius: designTokens.radius.button,
                      paddingHorizontal: designTokens.space.x3,
                    }}
                  >
                    <AppIcon name="share" size={15} />
                    <AppText role="button">Поделиться</AppText>
                  </MotionPressable>
                </View>
              </View>
            </View>
          ) : null}
          <View
            style={{
              gap: designTokens.space.x6,
              paddingHorizontal: productCanvasPadding,
            }}
          >
            <ProductTabs
              activeTab={activeTab}
              bidCount={bids.data?.bids.length}
              onChange={onTabChange}
            />
            <View
              nativeID={`product-panel-${activeTab}`}
              role="tabpanel"
              accessibilityLabelledBy={`product-tab-${activeTab}`}
            >
              {activeTab === 'about'
                ? itemStory
                : activeTab === 'creation'
                  ? creationStory
                  : bidHistory}
            </View>
            {activeTab === 'about' ? relatedWorksSection : null}
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
          {activeTab !== 'about' ? (
            <View style={{ paddingTop: designTokens.space.x12 }}>
              {auctionPlayer}
            </View>
          ) : null}
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
