import { PageScrollView } from '../../components/layout/PageScrollView';
import { useEffect, useId, useState } from 'react';
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
import { DEAL_STEPS, LotPanel } from '../commerce/LotPanel';
import { useLot } from '../commerce/use-lot';
import { lotSaleOpen, presentLot, syncedNowMs } from '../commerce/lot-view';
import { resolvePublicWorkPageState } from './public-work-page-state';
import { resolveWorkTab, workFacts, workTabs } from './work-content';
import { navigateWorkPageBack } from './work-page-back';
import { WorkHeader } from './WorkHeader';

export function ProductScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const router = useRouter();
  const { tab: requestedTab } = useLocalSearchParams<{ tab?: string }>();
  const panelId = useId();
  const palette = useAppTheme();
  const [shareOpen, setShareOpen] = useState(false);
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
        extended: lot.extended,
      })
    : null;
  const saleKnown =
    lot.status === 'ready' ||
    lot.status === 'stale' ||
    lot.status === 'empty' ||
    lot.status === 'empty-stale';
  const sale = saleKnown ? lotSaleOpen(saleView) : undefined;
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
          summary={<LotPanel read={lot} />}
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
    </AppShell>
  );
}
