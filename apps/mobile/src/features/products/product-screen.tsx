import { PageScrollView } from '../../components/layout/PageScrollView';
import { useEffect, useId, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import { AppShell } from '../../components/layout';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import {
  AppText,
  PageState,
  ResilientRemoteImage,
  productMediaStyle,
} from '../../components/ui';
import { WorkCoverCard } from '../../components/figma/WorkCoverCard';
import { WorkFactsList } from '../../components/figma/WorkFactsList';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { ShareSheet } from '../../components/figma/ShareSheet';
import { getApiAssetUrl } from '../../lib/environment';
import { useTrackWorkView } from '../../lib/analytics/use-track-views';
import { portfolioKeys } from '../../lib/query-cache';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import { useAppTheme } from '../../providers/theme-provider';
import { CancelLotDialog, CreateLotSheet } from '../commerce/CreateLotSheet';
import { LotCommerce } from '../commerce/LotCommerce';
import { DEAL_STEPS, LotPanel } from '../commerce/LotPanel';
import { useLot } from '../commerce/use-lot';
import { useAuth } from '../../providers/auth-provider';
import { sellerCommerceAccess } from '../commerce/create-lot-form';
import { lotSaleOpen, presentLot, syncedNowMs } from '../commerce/lot-view';
import { useSellerCapability } from '../../hooks/use-seller-capability';
import { resolvePublicWorkPageState } from './public-work-page-state';
import { resolveWorkTab, workFacts, workTabs } from './work-content';
import { navigateWorkPageBack } from './work-page-back';
import { WorkHeader } from './WorkHeader';

export function ProductScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const router = useRouter();
  const { tab: requestedTab, sell } = useLocalSearchParams<{
    tab?: string;
    sell?: string;
  }>();
  const panelId = useId();
  const palette = useAppTheme();
  const [shareOpen, setShareOpen] = useState(false);
  const [sheet, setSheet] = useState<'bid' | 'buy' | 'history' | 'sell' | 'cancel' | null>(
    null,
  );
  const auth = useAuth();
  const capability = useSellerCapability();
  const sales = sellerCommerceAccess(capability.isLoading ? null : capability.status);
  const query = useQuery({
    queryKey: portfolioKeys.work(publicId),
    queryFn: ({ signal }) => api.portfolio.getWork(publicId, { signal }),
    retry: retryTransientPublicQuery,
  });
  const lot = useLot(publicId);
  const saleView = lot.lot
    ? presentLot({
        lot: lot.lot,
        syncedNowMs: syncedNowMs({
          serverNow: lot.lot.serverNow,
          dataUpdatedAt: lot.dataUpdatedAt,
          deviceNow: Date.now(),
        }),
        extensionUntil: lot.extensionUntil,
        nowMs: Date.now(),
      })
    : null;
  const saleKnown =
    lot.status === 'ready' ||
    lot.status === 'stale' ||
    lot.status === 'empty' ||
    lot.status === 'empty-stale';
  const sale = saleKnown ? lotSaleOpen(saleView) : undefined;
  const isOwner = Boolean(
    auth.user?.id &&
      capability.profile?.userId === auth.user.id &&
      query.data?.author.id === capability.profile.id,
  );
  const consumedSell = useRef(false);
  useEffect(() => {
    consumedSell.current = false;
    setSheet(null);
  }, [publicId]);
  useEffect(() => {
    if (sell !== '1' || consumedSell.current || !query.data) return;
    if (lot.status === 'loading' || lot.status === 'auth-loading') return;
    if (auth.isAuthenticated && capability.isLoading) return;
    consumedSell.current = true;
    if (isOwner && sales.startSale && !lot.lot && lot.status === 'empty') setSheet('sell');
    router.setParams({ sell: undefined });
  }, [
    sell,
    query.data,
    lot.status,
    lot.lot,
    isOwner,
    router,
    auth.isAuthenticated,
    capability.isLoading,
    sales.startSale,
  ]);
  useEffect(() => {
    if (!query.data || !requestedTab) return;
    if (sale === undefined && requestedTab === 'delivery') return;
    const resolved = resolveWorkTab(
      query.data.work.creationStory.blocks,
      requestedTab,
      sale === true,
    );
    if (resolved !== requestedTab) router.setParams({ tab: undefined });
  }, [query.data, requestedTab, router, sale]);
  useTrackWorkView({
    productPublicId: publicId,
    sellerProfileId: query.data?.author.id,
    enabled: Boolean(query.data),
  });
  const pageState = resolvePublicWorkPageState(query);
  if (pageState === 'not_found') {
    return (
      <AppShell contentLayout="bleed">
        <PageScrollView>
          <PageState
            title="Работа не найдена"
            message="Работа больше недоступна."
          />
        </PageScrollView>
      </AppShell>
    );
  }
  if (pageState === 'loading' || pageState === 'error' || !query.data)
    return (
      <AppShell contentLayout="bleed">
        <PageScrollView>
          <InfrastructurePageStatus
            status={pageState === 'loading' ? 'loading' : 'error'}
            onRetry={() => void query.refetch()}
          />
        </PageScrollView>
      </AppShell>
    );
  const { work, author, relatedWorks } = query.data;
  const tab = resolveWorkTab(
    work.creationStory.blocks,
    sale === true ? requestedTab : requestedTab === 'delivery' ? undefined : requestedTab,
    sale === true,
  );
  const facts = workFacts(work);
  const related = relatedWorks.filter(
    (item) => item.work.publicId !== publicId,
  );
  const chips = [
    ...new Set(
      [author.city, work.materials, work.technique].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  ];
  return (
    <AppShell contentLayout="bleed">
      <PageScrollView
        testID="product-scroll-view"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 0,
          gap: designTokens.space.sectionGap,
        }}
      >
        <WorkHeader
          key={publicId}
          images={work.images}
          title={work.title}
          authorName={author.fullName}
          authorHref={
            {
              pathname: '/seller/[slug]',
              params: { slug: author.slug },
            } as Href
          }
          chips={chips}
          tabs={workTabs(work.creationStory.blocks, sale === true)}
          tab={tab}
          onTabChange={(value) => router.setParams({ tab: value })}
          panelId={panelId}
          onBack={() => navigateWorkPageBack(router)}
          onShare={() => setShareOpen(true)}
          summary={
            <LotPanel
              read={lot}
              listOffer={
                isOwner && !lot.lot && (lot.status === 'empty' || lot.status === 'empty-stale')
                  ? {
                      enabled: lot.status === 'empty' && sales.startSale,
                      reason:
                        capability.status === 'SUSPENDED'
                          ? 'Аккаунт автора приостановлен.'
                          : lot.status === 'empty-stale'
                            ? 'Данные продажи устарели.'
                            : null,
                    }
                  : null
              }
              onList={() => setSheet('sell')}
              onAction={(action) => {
                if (!action.enabled) return;
                if (action.kind === 'cancel-lot') setSheet('cancel');
                else if (action.kind === 'bid') setSheet('bid');
                else if (action.kind === 'buy') setSheet('buy');
                else if (action.kind === 'sign-in') {
                  router.push({
                    pathname: '/login',
                    params: { redirectTo: `/product/${publicId}` },
                  });
                } else if (action.kind === 'verify-email') {
                  router.push(
                    `/verify-email?redirectTo=${encodeURIComponent(`/product/${publicId}`)}` as Href,
                  );
                } else if (action.kind === 'contacts') {
                  router.push(
                    `/account/contacts?redirectTo=${encodeURIComponent(`/product/${publicId}`)}` as Href,
                  );
                }
              }}
              onHistory={() => setSheet('history')}
            />
          }
        >
          <View
            style={{
              gap: designTokens.space.x10,
            }}
          >
            <View
              nativeID={panelId}
              role="tabpanel"
              aria-labelledby={`${panelId}-${tab}`}
              style={{ paddingBottom: designTokens.space.sectionGap }}
            >
              {tab === 'story' ? (
                <View
                  testID="work-history"
                  style={{ gap: designTokens.space.x5 }}
                >
                  {work.creationStory.blocks.map((block) =>
                    block.type === 'IMAGE' ? (
                      <View key={block.id} testID="work-history-image">
                        <ResilientRemoteImage
                          uri={getApiAssetUrl(
                            `/api/products/${work.id}/story-images/${block.mediaAssetId}`,
                          )}
                          component="ProductGallery"
                          accessibilityLabel={
                            block.altText ?? `${work.title}, фото из истории`
                          }
                          fallbackLabel="Изображение недоступно"
                          style={productMediaStyle('100%', palette)}
                        />
                      </View>
                    ) : (
                      <AppText
                        key={block.id}
                        role={block.type === 'HEADING' ? 'label' : 'bodySmall'}
                      >
                        {block.text}
                      </AppText>
                    ),
                  )}
                </View>
              ) : tab === 'delivery' && saleView?.deal ? (
                <View testID="work-deal" style={{ gap: designTokens.space.x3 }}>
                  {DEAL_STEPS.map((step) => (
                    <AppText key={step} role="bodySmall">
                      {step}
                    </AppText>
                  ))}
                  {saleView.contactLine ? (
                    <AppText role="bodySmall">{saleView.contactLine}</AppText>
                  ) : null}
                </View>
              ) : (
                <WorkFactsList facts={facts} />
              )}
            </View>
            {related.length > 0 ? (
              <View style={{ gap: designTokens.space.sectionGap }}>
                <AppText
                  role="workTitle"
                  accessibilityRole="header"
                  aria-level={2}
                >
                  Другие работы автора
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginRight: -designTokens.layout.gutter }}
                  contentContainerStyle={{
                    gap: designTokens.space.x3,
                    paddingRight: designTokens.layout.gutter,
                  }}
                >
                  {related.map((item) => (
                    <View
                      key={item.work.publicId}
                      style={{ width: designTokens.size.coverWidth }}
                    >
                      <WorkCoverCard
                        href={`/product/${item.work.publicId}`}
                        imageUrl={item.work.images[0].url}
                        imagePresentation={item.work.images[0]}
                        imageLabel={item.work.title}
                        title={item.work.title}
                        authorSlug={item.author.slug}
                      />
                    </View>
                  ))}
                </ScrollView>
                <FigmaButton
                  label="Смотреть все"
                  variant="outline"
                  icon="arrow-right-01"
                  iconPosition="right"
                  accessibilityHint={`Открыть все работы автора ${author.fullName}`}
                  onPress={() =>
                    router.push({
                      pathname: '/seller/[slug]',
                      params: { slug: author.slug },
                    } as Href)
                  }
                />
              </View>
            ) : null}
          </View>
        </WorkHeader>
      </PageScrollView>
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        sharePath={work.sharePath}
      />
      <LotCommerce
        publicId={publicId}
        lot={lot.lot}
        title={work.title}
        imageUrl={
          work.images[0] ? getApiAssetUrl(work.images[0].url) : null
        }
        mode={sheet === 'bid' || sheet === 'buy' || sheet === 'history' ? sheet : null}
        onClose={() => setSheet(null)}
        onPurchased={(order) => {
          setSheet(null);
          router.push(`/account/orders/${order.publicId}` as Href);
        }}
      />
      <CreateLotSheet
        open={sheet === 'sell'}
        productId={work.id}
        publicId={publicId}
        title={work.title}
        imageUrl={work.images[0] ? getApiAssetUrl(work.images[0].url) : null}
        onClose={() => setSheet(null)}
      />
      <CancelLotDialog
        open={sheet === 'cancel'}
        publicId={publicId}
        listingId={lot.lot?.id ?? null}
        onClose={() => setSheet(null)}
      />
    </AppShell>
  );
}
