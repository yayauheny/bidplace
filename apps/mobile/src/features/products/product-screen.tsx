import { useEffect, useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import { AppShell } from '../../components/layout';
import {
  AppText,
  MotionPressable,
  PageState,
  ResilientRemoteImage,
  productMediaStyle,
} from '../../components/ui';
import { WorkGallery } from '../../components/figma/WorkGallery';
import { WorkCoverCard } from '../../components/figma/WorkCoverCard';
import { WorkFactsList } from '../../components/figma/WorkFactsList';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { FigmaChip } from '../../components/figma/FigmaChip';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { ShareSheet } from '../../components/figma/ShareSheet';
import { getApiAssetUrl } from '../../lib/environment';
import { useTrackWorkView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import { PAYMENT_DELIVERY_STUB } from './payment-delivery-stub';
import { resolvePublicWorkPageState } from './public-work-page-state';
import {
  resolveWorkTab,
  workFacts,
  workHistoryBlocks,
  workTabs,
} from './work-content';

export { PAYMENT_DELIVERY_STUB };

export function ProductScreen({ publicId }: { publicId: string }) {
  const api = useApiClient();
  const router = useRouter();
  const { tab: requestedTab } = useLocalSearchParams<{ tab?: string }>();
  const panelId = useId();
  const [shareOpen, setShareOpen] = useState(false);
  const query = useQuery({
    queryKey: ['portfolio-work', publicId],
    queryFn: () => api.portfolio.getWork(publicId),
    retry: retryTransientPublicQuery,
  });
  useEffect(() => {
    if (
      query.data &&
      requestedTab &&
      resolveWorkTab(query.data.work.story, requestedTab) !== requestedTab
    ) {
      router.setParams({ tab: undefined });
    }
  }, [query.data, requestedTab, router]);
  useTrackWorkView({
    productPublicId: publicId,
    sellerProfileId: query.data?.author.id,
    enabled: Boolean(query.data),
  });
  const pageState = resolvePublicWorkPageState(query);
  if (pageState === 'loading')
    return (
      <AppShell>
        <PageState title="Загружаем работу…" loading />
      </AppShell>
    );
  if (pageState === 'not_found') {
    return (
      <AppShell>
        <PageState
          title="Работа не найдена"
          message="Работа больше недоступна."
        />
      </AppShell>
    );
  }
  if (pageState === 'error' || !query.data)
    return (
      <AppShell>
        <PageState
          title="Не удалось загрузить работу"
          retry={() => void query.refetch()}
        />
      </AppShell>
    );
  const { work, author, relatedWorks } = query.data;
  const tab = resolveWorkTab(work.story, requestedTab);
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
    <AppShell>
      <ScrollView
        testID="product-scroll-view"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: designTokens.size.dockReserve,
          gap: designTokens.space.sectionGap,
        }}
      >
        <WorkGallery
          key={publicId}
          images={work.images}
          label={work.title}
          action={
            <FigmaGlassSurface
              preset="controlGroup"
              contentStyle={{ padding: designTokens.space.socialGroupY }}
            >
              <FigmaIconButton
                icon="share-04"
                iconSize={designTokens.size.socialGroupIcon}
                label="Поделиться работой"
                onPress={() => setShareOpen(true)}
              />
            </FigmaGlassSurface>
          }
        />
        <View
          style={{
            paddingHorizontal: designTokens.space.pageGutter,
            gap: designTokens.space.x10,
          }}
        >
          <View style={{ gap: designTokens.space.x3 }}>
            <View style={{ gap: designTokens.space.x2 }}>
              <AppText role="workTitle" accessibilityRole="header">
                {work.title}
              </AppText>
              <Link
                href={
                  {
                    pathname: '/seller/[slug]',
                    params: { slug: author.slug },
                  } as Href
                }
                asChild
              >
                <MotionPressable
                  accessibilityRole="link"
                  accessibilityLabel={`Открыть профиль автора ${author.fullName}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: designTokens.space.x1,
                  }}
                >
                  <AppText
                    role="workAuthor"
                    tone="subdued"
                    style={{ flexShrink: 1 }}
                  >
                    {author.fullName}
                  </AppText>
                  <FigmaIcon
                    name="arrow-right-01"
                    color={designTokens.color.textSubdued}
                  />
                </MotionPressable>
              </Link>
            </View>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: designTokens.space.workChipGap,
              }}
            >
              {chips.map((chip) => (
                <FigmaChip key={chip} label={chip} tone="onGlass" size="work" />
              ))}
            </View>
          </View>
          <View style={{ gap: designTokens.space.x6 }}>
            <FigmaTabs
              tabs={workTabs(work.story)}
              value={tab}
              onChange={(value) => router.setParams({ tab: value })}
              label="Информация о работе"
              panelId={panelId}
            />
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
                  {workHistoryBlocks(work.story, work.images).map(
                    (block, index) =>
                      block.type === 'text' ? (
                        <AppText key={`text-${index}`} role="bodySmall">
                          {block.text}
                        </AppText>
                      ) : (
                        <View
                          key={block.image.id}
                          testID="work-history-image"
                        >
                          <ResilientRemoteImage
                            uri={getApiAssetUrl(block.image.url)}
                            component="ProductGallery"
                            accessibilityLabel={`${work.title}, фото из истории`}
                            fallbackLabel="Изображение недоступно"
                            style={productMediaStyle()}
                          />
                        </View>
                      ),
                  )}
                </View>
              ) : tab === 'delivery' ? (
                <AppText role="bodySmall">{PAYMENT_DELIVERY_STUB}</AppText>
              ) : (
                <WorkFactsList facts={facts} />
              )}
            </View>
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
                style={{ marginRight: -designTokens.space.pageGutter }}
                contentContainerStyle={{
                  gap: designTokens.space.x3,
                  paddingRight: designTokens.space.pageGutter,
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
      </ScrollView>
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        sharePath={work.sharePath}
      />
    </AppShell>
  );
}
