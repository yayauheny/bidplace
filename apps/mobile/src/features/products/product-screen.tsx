import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ExpoLinking from 'expo-linking';
import { Link, type Href, useRouter } from 'expo-router';
import {
  Platform,
  ScrollView,
  Share,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';

import type { ApiClient } from '@bidplace/api-client';
import type { ActivityStatus } from '@bidplace/contracts';
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
  SlideToBid,
  TextField,
  MotionPressable,
} from '../../components/ui';
import { formatDateTime, formatDisplayPrice } from '../../lib/formatters';
import { getApiAssetUrl } from '../../lib/environment';
import { getErrorStatus, getUserFacingErrorMessage } from '../../lib/errors';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useListingRealtime } from '../../lib/use-listing-realtime';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import {
  EmailRulesDialog,
  useEmailRulesEligibility,
} from '../auth/email-rules-gate';
import { validateBidAmount } from './bid-validation';
import { getCatalogColumnCount } from './catalog-layout';

type BidItem = Awaited<
  ReturnType<ApiClient['listings']['listBids']>
>['bids'][number];
type BidAttempt = { listingId: string; amount: number; idempotencyKey: string };
type ListingStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | 'DRAFT';
type DetailItem = { label: string; value: string };
type AboutSectionId = 'characteristics' | 'packaging' | 'delivery';

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

function participationLabel(status: ActivityStatus): string {
  const labels: Record<ActivityStatus, string> = {
    LEADING: 'Побеждаете',
    OUTBID: 'Ставка перебита',
    WON: 'Выиграли',
    LOST: 'Торги завершены',
    AWAITING_SELLER_CONTACT: 'Ожидается связь с автором',
    WIN_CANCELLED: 'Покупка отменена',
    COMPLETED: 'Покупка завершена',
  };
  return labels[status];
}

function participationTone(
  status: ActivityStatus,
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

function AboutAccordionRow({
  body,
  expanded,
  index,
  label,
  onToggle,
}: {
  body: React.ReactNode;
  expanded: boolean;
  index: number;
  label: string;
  onToggle: () => void;
}) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: designTokens.color.border,
      }}
    >
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={`${String(index).padStart(2, '0')} ${label}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        preset="button"
        style={{
          minHeight: 64,
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x3,
          paddingHorizontal: designTokens.space.x3,
        }}
      >
        <AppText role="metadata" tone="secondary" style={{ width: 24 }}>
          {String(index).padStart(2, '0')}
        </AppText>
        <AppText role="label" style={{ flex: 1 }}>
          {label}
        </AppText>
        <AppIcon name={expanded ? 'minus' : 'plus'} size={16} />
      </MotionPressable>
      {expanded ? (
        <View
          nativeID={`product-about-section-${index}`}
          accessibilityRole="summary"
          style={{
            gap: designTokens.space.x3,
            paddingHorizontal: designTokens.space.x8,
            paddingBottom: designTokens.space.x5,
          }}
        >
          {body}
        </View>
      ) : null}
    </View>
  );
}

function ProductAboutAuthorPanel({
  profile,
}: {
  profile: {
    fullName: string;
    slug: string;
    profilePhotoUrl: string;
    shortDescription: string;
  };
}) {
  return (
    <View
      style={{
        width: 376,
        minHeight: 310,
        gap: designTokens.space.x4,
        paddingHorizontal: 28,
        paddingVertical: 24,
        borderRadius: designTokens.radius.aboutPanel,
        backgroundColor: designTokens.color.surfacePanel,
      }}
    >
      <AppText role="sectionTitle">Автор</AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x3,
        }}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(profile.profilePhotoUrl)}
          component="ProductAuthor"
          accessibilityLabel={`Фото автора: ${profile.fullName}`}
          fallbackLabel={`Фото автора недоступно: ${profile.fullName}`}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
        />
        <View style={{ flex: 1, gap: designTokens.space.x1 }}>
          <AppText role="label">{profile.fullName}</AppText>
          <AppText role="bodySmall" tone="secondary">
            @{profile.slug}
          </AppText>
        </View>
      </View>
      <AppText role="bodySmall" tone="secondary">
        {profile.shortDescription}
      </AppText>
      <Link
        href={
          { pathname: '/seller/[slug]', params: { slug: profile.slug } } as Href
        }
        asChild
      >
        <MotionPressable
          accessibilityRole="link"
          accessibilityLabel={`Открыть страницу автора ${profile.fullName}`}
          preset="button"
          style={{
            minHeight: designTokens.size.touch,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: designTokens.color.border,
            paddingTop: designTokens.space.x3,
          }}
        >
          <AppText role="label">Страница автора</AppText>
          <AppIcon name="chevronRight" size={16} />
        </MotionPressable>
      </Link>
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
  return (
    <AppShell bottomAction={bottomAction} ambientVariant="product">
      {children}
    </AppShell>
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { eligibility } = useEmailRulesEligibility();
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
  const [participationDialogOpen, setParticipationDialogOpen] = useState(false);
  const [bidValidationError, setBidValidationError] = useState<string | null>(
    null,
  );
  const [openCreationStep, setOpenCreationStep] = useState(0);
  const [openAboutSection, setOpenAboutSection] =
    useState<AboutSectionId | null>('characteristics');
  const [now, setNow] = useState(Date.now());
  const [heroHeight, setHeroHeight] = useState(0);
  const [isPlayerSticky, setIsPlayerSticky] = useState(false);
  const [isRefreshingBid, setIsRefreshingBid] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );

  const toggleAboutSection = (section: AboutSectionId) => {
    setOpenAboutSection((current) => (current === section ? null : section));
  };

  const query = useQuery({
    queryKey: ['products', publicId],
    queryFn: () => api.products.get(publicId),
  });
  const sellerSlug = query.data?.sellerProfile.slug;
  const relatedWorks = useQuery({
    queryKey: ['public-seller', sellerSlug],
    queryFn: () => api.sellers.getPublicDetail(sellerSlug!),
    enabled: activeTab === 'about' && Boolean(sellerSlug),
    retry: retryTransientPublicQuery,
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

  useEffect(() => {
    setIsPlayerSticky(false);
  }, [activeTab]);

  const refreshListing = () => {
    void queryClient.invalidateQueries({ queryKey: ['products', publicId] });
    if (listingId)
      void queryClient.invalidateQueries({
        queryKey: ['listings', listingId, 'bids'],
      });
    if (auth.isAuthenticated && !auth.isAdmin)
      void queryClient.invalidateQueries({ queryKey: ['user', 'activity'] });
  };

  const shareProduct = async () => {
    const productUrl =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? new URL(`/product/${publicId}`, window.location.origin).toString()
        : ExpoLinking.createURL(`/product/${publicId}`);

    try {
      if (Platform.OS === 'web') {
        const shareNavigator = navigator as Navigator & {
          share?: (data: { url: string }) => Promise<void>;
        };
        if (shareNavigator.share) {
          await shareNavigator.share({ url: productUrl });
        } else {
          let copied = false;
          if (navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(productUrl);
              copied = true;
            } catch {
              copied = false;
            }
          }
          if (!copied) {
            const input = document.createElement('textarea');
            input.value = productUrl;
            input.setAttribute('readonly', '');
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            copied = document.execCommand('copy');
            input.remove();
          }
          if (!copied) throw new Error('Sharing is unavailable');
        }
      } else {
        await Share.share({ message: productUrl });
      }
      setShareState('success');
    } catch {
      setShareState('error');
    }
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
      setConfirmationAttempt(null);
      setBidValidationError(null);
      refreshListing();
    },
    onError: async (error, attempt) => {
      const refreshed = await query.refetch();
      const refreshedMinimum = refreshed.data?.minimumNextBid ?? null;

      if (
        getErrorStatus(error) === 400 &&
        refreshedMinimum !== null &&
        refreshedMinimum > attempt.amount
      ) {
        setBidValidationError(
          `Ставка уже изменилась. Новая минимальная ставка — ${formatDisplayPrice(refreshedMinimum)}.`,
        );
        setAmount(String(refreshedMinimum));
      } else {
        setBidValidationError(
          getUserFacingErrorMessage(
            error,
            'Не удалось отправить ставку. Проверьте соединение и попробуйте ещё раз.',
          ),
        );
      }
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
    { label: 'Состояние', value: product.condition },
    { label: 'Уникальность', value: product.uniqueness },
    { label: 'Город', value: product.city },
    { label: 'Передача', value: product.deliveryInfo },
  ].filter((item): item is DetailItem => item !== null);

  const sendBid = (attempt: BidAttempt) => {
    setPendingAttempt(attempt);
    bid.mutate(attempt);
  };
  const openBidDialog = async () => {
    if (!listing) return;
    setIsRefreshingBid(true);
    const refreshed = await query.refetch();
    setIsRefreshingBid(false);
    const freshListing = refreshed.data?.listing;
    const freshMinimumNextBid = refreshed.data?.minimumNextBid ?? null;
    if (refreshed.isError || !freshListing) {
      setBidValidationError(
        'Не удалось обновить данные торгов. Попробуйте ещё раз.',
      );
      return;
    }
    const nextInput = amount.trim() || String(freshMinimumNextBid ?? '');
    const error = validateBidAmount(nextInput, freshMinimumNextBid);
    if (error) {
      setBidValidationError(error);
      return;
    }
    setBidValidationError(null);
    setAmount(nextInput);
    const nextAmount = Number(nextInput.replace(',', '.'));
    let reusable = pendingAttempt;
    if (
      !reusable ||
      reusable.listingId !== listing.id ||
      reusable.amount !== nextAmount
    ) {
      try {
        reusable = {
          listingId: freshListing.id,
          amount: nextAmount,
          idempotencyKey: newIdempotencyKey(),
        };
      } catch (error) {
        setBidValidationError(
          getUserFacingErrorMessage(
            error,
            'Это устройство не может безопасно подготовить ставку.',
          ),
        );
        return;
      }
    }
    setConfirmationAttempt(reusable);
  };
  const beginParticipation = () => {
    if (eligibility === 'guest') {
      router.push({
        pathname: '/login',
        params: { redirectTo: `/product/${publicId}` },
      });
      return;
    }
    if (eligibility === 'ready') {
      void openBidDialog();
      return;
    }
    setParticipationDialogOpen(true);
  };
  const confirmBid = () => {
    if (!confirmationAttempt) return;
    const error = validateBidAmount(amount, minimumNextBid);
    if (error) {
      setBidValidationError(error);
      return;
    }
    const nextAmount = Number(amount.replace(',', '.'));
    let attempt = confirmationAttempt;
    if (confirmationAttempt.amount !== nextAmount) {
      try {
        attempt = {
          listingId: confirmationAttempt.listingId,
          amount: nextAmount,
          idempotencyKey: newIdempotencyKey(),
        };
      } catch (error) {
        setBidValidationError(
          getUserFacingErrorMessage(
            error,
            'Это устройство не может безопасно подготовить ставку.',
          ),
        );
        return;
      }
    }
    sendBid(attempt);
  };
  const parsedBidAmount = Number(amount.replace(',', '.'));
  const confirmationAmount =
    Number.isFinite(parsedBidAmount) && parsedBidAmount > 0
      ? parsedBidAmount
      : confirmationAttempt?.amount;

  const canParticipate = listing?.status === 'LIVE' && !auth.isAdmin;
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
      currentPriceLabel={formatDisplayPrice(listing.currentPrice)}
      startPriceLabel={formatDisplayPrice(listing.auctionRules.startPrice)}
      minimumNextBidLabel={
        minimumNextBid === null ? undefined : formatDisplayPrice(minimumNextBid)
      }
      timingLabel={
        listing.status === 'LIVE'
          ? `До завершения: ${formatRemainingTime(listing.endsAt, now)}`
          : listing.status === 'SCHEDULED'
            ? `Начало: ${formatDateTime(listing.startsAt)}`
            : 'Статус: Торги завершены'
      }
      deadlineLabel={`Окончание: ${formatDateTime(listing.endsAt)}`}
      actionLabel={
        canParticipate && isProductWide
          ? eligibility === 'guest'
            ? 'Войти'
            : 'Поставить'
          : undefined
      }
      actionDisabled={bid.isPending || isRefreshingBid}
      actionLoading={bid.isPending || isRefreshingBid}
      onAction={canParticipate ? beginParticipation : undefined}
      width={isHeroThreeColumn ? 404 : undefined}
    />
  ) : (
    <SurfacePanel>
      <AppText role="bodySmall" tone="secondary">
        Сейчас нет активного размещения.
      </AppText>
    </SurfacePanel>
  );
  const stickyThreshold =
    activeTab === 'about' ? Math.max(heroHeight - 96, 0) : 1;
  const handleScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Platform.OS !== 'web' || !isDesktop || stickyThreshold <= 0) return;
    setIsPlayerSticky(nativeEvent.contentOffset.y >= stickyThreshold);
  };
  const stickyPlayerStyle = {
    position: 'fixed',
    right: 0,
    bottom: 24,
    left: 0,
    zIndex: designTokens.layer.popover,
    alignItems: 'center',
    pointerEvents: 'box-none',
  } as unknown as ViewStyle;
  const itemStory = (
    <View
      style={{
        flexDirection: isProductWide ? 'row' : 'column',
        gap: designTokens.space.x6,
      }}
    >
      <View
        style={{
          width: isProductWide ? 832 : '100%',
          minHeight: isProductWide ? 620 : undefined,
          gap: designTokens.space.x5,
          paddingHorizontal: isProductWide ? 32 : 0,
          paddingVertical: isProductWide ? 28 : 0,
          borderRadius: isProductWide
            ? designTokens.radius.aboutPanel
            : undefined,
          backgroundColor: isProductWide
            ? designTokens.color.surfacePanel
            : 'transparent',
        }}
      >
        <AppText role="sectionTitle">О работе</AppText>
        <AppText role="body">{product.story}</AppText>
        <AppText role="bodySmall" tone="secondary">
          {product.provenance}
        </AppText>
        <View>
          <AboutAccordionRow
            index={1}
            label="Характеристики"
            expanded={openAboutSection === 'characteristics'}
            onToggle={() => toggleAboutSection('characteristics')}
            body={
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: designTokens.space.x5,
                }}
              >
                {detailItems.map((item) => (
                  <View
                    key={item.label}
                    style={{
                      minWidth: 120,
                      flex: 1,
                      gap: designTokens.space.x1,
                    }}
                  >
                    <AppText role="caption" tone="secondary">
                      {item.label}
                    </AppText>
                    <AppText role="label">{item.value}</AppText>
                  </View>
                ))}
              </View>
            }
          />
          {product.packaging ? (
            <AboutAccordionRow
              index={2}
              label="Упаковка"
              expanded={openAboutSection === 'packaging'}
              onToggle={() => toggleAboutSection('packaging')}
              body={
                <AppText role="bodySmall" tone="secondary">
                  {product.packaging}
                </AppText>
              }
            />
          ) : null}
          <AboutAccordionRow
            index={product.packaging ? 3 : 2}
            label="Оплата и доставка"
            expanded={openAboutSection === 'delivery'}
            onToggle={() => toggleAboutSection('delivery')}
            body={
              <AppText role="bodySmall" tone="secondary">
                {product.deliveryInfo}
              </AppText>
            }
          />
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: designTokens.color.border,
            }}
          />
        </View>
      </View>
      {isProductWide ? (
        <ProductAboutAuthorPanel
          profile={{
            fullName: sellerProfile.fullName,
            slug: sellerProfile.slug,
            profilePhotoUrl: sellerProfile.profilePhotoUrl,
            shortDescription: sellerProfile.shortDescription,
          }}
        />
      ) : null}
    </View>
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
                {formatDisplayPrice(item.amount)}
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
                ) : null}
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
          Автор не добавил историю создания.
        </AppText>
      )}
    </View>
  );
  const relatedItems = relatedWorks.data
    ? relatedWorks.data.products
        .filter((item) => item.product.publicId !== product.publicId)
        .slice(0, 4)
    : [];
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
        !isProductWide && canParticipate ? (
          <BottomActionBar
            summary={
              <View style={{ gap: designTokens.space.x1 }}>
                <AppText role="metadata" tone="secondary">
                  Минимальная ставка
                </AppText>
                <AppText role="numeric">
                  {minimumNextBid === null
                    ? 'Недоступна'
                    : formatDisplayPrice(minimumNextBid)}
                </AppText>
              </View>
            }
          >
            <PrimaryButton
              compact
              label={eligibility === 'guest' ? 'Войти' : 'Сделать ставку'}
              loading={bid.isPending || isRefreshingBid}
              onPress={beginParticipation}
              accessibilityHint="Открывает последовательный сценарий участия в торгах"
            />
          </BottomActionBar>
        ) : undefined
      }
    >
      <ScrollView
        testID="product-scroll-view"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: designTokens.space.x6,
          paddingBottom:
            !isProductWide && canParticipate
              ? designTokens.space.x16
              : designTokens.space.x8,
        }}
        style={{ backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
          }}
        >
          {activeTab === 'about' ? (
            <View
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: designTokens.layout.productDetailMaxWidth,
                alignSelf: 'center',
                minHeight: isHeroThreeColumn ? 780 : undefined,
                paddingHorizontal: productCanvasPadding,
                paddingTop: isDesktop
                  ? designTokens.space.x3
                  : designTokens.space.x6,
                paddingBottom: isDesktop
                  ? designTokens.space.x12
                  : designTokens.space.x8,
              }}
              onLayout={(event) =>
                setHeroHeight(event.nativeEvent.layout.height)
              }
            >
              <View
                style={{
                  position: 'relative',
                  width: isHeroThreeColumn
                    ? designTokens.layout.productHeroContentWidth
                    : '100%',
                  alignSelf: 'center',
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
                    {product.title}
                  </AppText>
                  <AppText role="body" tone="secondary" numberOfLines={5}>
                    {product.story}
                  </AppText>
                </View>
                <View
                  style={{
                    width: isHeroThreeColumn ? 520 : '100%',
                    minWidth: 0,
                    alignItems: isHeroThreeColumn ? 'center' : 'stretch',
                    gap: designTokens.space.x8,
                  }}
                >
                  <ProductGallery
                    images={product.images}
                    label={product.title}
                  />
                  {!isPlayerSticky ? auctionPlayer : null}
                  {adminBidNotice}
                </View>
                <View
                  style={{
                    width: isHeroThreeColumn ? 312 : '100%',
                    maxWidth: '100%',
                    paddingTop: isHeroThreeColumn ? 102 : 0,
                    gap: designTokens.space.x5,
                  }}
                >
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
                    onPress={() => void shareProduct()}
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
                    <AppText role="button">
                      {shareState === 'success'
                        ? 'Ссылка скопирована'
                        : shareState === 'error'
                          ? 'Не удалось поделиться'
                          : 'Поделиться'}
                    </AppText>
                  </MotionPressable>
                </View>
              </View>
            </View>
          ) : null}
          <View
            style={{
              width: '100%',
              backgroundColor: designTokens.color.surfaceWarm,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: designTokens.layout.productDetailMaxWidth,
                alignSelf: 'center',
                gap: designTokens.space.x6,
                paddingHorizontal: productCanvasPadding,
                paddingBottom: designTokens.space.x8,
              }}
            >
              <ProductTabs activeTab={activeTab} onChange={onTabChange} />
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
          </View>
          {activeTab !== 'about' ? (
            <View
              style={{
                width: '100%',
                maxWidth: designTokens.layout.productDetailMaxWidth,
                alignSelf: 'center',
                paddingTop: designTokens.space.x12,
              }}
            >
              {!isPlayerSticky ? auctionPlayer : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
      {isPlayerSticky && Platform.OS === 'web' && isDesktop ? (
        <View testID="product-sticky-auction-player" style={stickyPlayerStyle}>
          {auctionPlayer}
        </View>
      ) : null}
      <AppDialog
        open={confirmationAttempt !== null}
        title="Сделать ставку"
        description={
          listing && confirmationAttempt
            ? `Вы делаете ставку на «${product.title}» на сумму ${formatDisplayPrice(confirmationAmount ?? confirmationAttempt.amount)}. Минимальная сумма по данным сервера: ${minimumNextBid === null ? 'недоступна' : formatDisplayPrice(minimumNextBid)}. Торги завершаются ${formatDateTime(listing.endsAt)}. Ставка необратима.`
            : undefined
        }
        onClose={() => setConfirmationAttempt(null)}
      >
        {confirmationAttempt ? (
          <>
            <BidForm
              amount={amount}
              minimumNextBid={minimumNextBid}
              validationError={
                bidValidationError ?? validateBidAmount(amount, minimumNextBid)
              }
              isPending={bid.isPending || isRefreshingBid}
              hasFailedAttempt={bid.isError}
              onAmountChange={(value) => {
                setAmount(value);
                setBidValidationError(null);
              }}
              onSubmit={confirmBid}
              onRetry={confirmBid}
              showPrimaryAction={false}
            />
            <SlideToBid
              label={`Поставить · ${formatDisplayPrice(confirmationAmount ?? confirmationAttempt.amount)}`}
              disabled={Boolean(validateBidAmount(amount, minimumNextBid))}
              loading={bid.isPending}
              resetKey={amount}
              onComplete={confirmBid}
            />
            <SecondaryButton
              label="Отмена"
              disabled={bid.isPending}
              onPress={() => setConfirmationAttempt(null)}
            />
          </>
        ) : null}
      </AppDialog>
      <EmailRulesDialog
        open={participationDialogOpen}
        redirectTo={`/product/${publicId}`}
        onClose={() => setParticipationDialogOpen(false)}
        onReady={() => {
          setParticipationDialogOpen(false);
          void openBidDialog();
        }}
      />
    </ProductShell>
  );
}
