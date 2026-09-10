import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AchievementsTimeline } from '../../components/figma/AchievementsTimeline';
import { CreatorAboutSections } from '../../components/figma/CreatorAboutSections';
import { CreatorHero } from '../../components/figma/CreatorHero';
import { CreatorProfileTabs } from '../../components/figma/CreatorProfileTabs';
import { CreatorSocialActions } from '../../components/figma/CreatorSocialActions';
import { ShareSheet } from '../../components/figma/ShareSheet';
import { WorkCoverCard } from '../../components/figma/WorkCoverCard';
import {
  parseCreatorProfileTabParam,
  type CreatorProfileTabId,
} from '../../components/figma/creator-profile-tabs';
import { AppShell } from '../../components/layout';
import { PageState, PrimaryButton } from '../../components/ui';
import { publicShareUrl } from '../../lib/public-share-url';
import { useTrackSellerView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import {
  authorDisciplineTags,
  toAchievementRecords,
} from './creator-profile-composition';

export function PublicSellerScreen({
  slug,
  sort = 'newest',
  tab,
}: {
  slug: string;
  sort?: 'newest' | 'oldest';
  tab?: string | string[];
}) {
  const api = useApiClient();
  const { push } = useRouter();
  const activeTab = parseCreatorProfileTabParam(tab);
  const [shareOpen, setShareOpen] = useState(false);
  const query = useInfiniteQuery({
    queryKey: ['public-author', slug, { sort }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.portfolio.getAuthor(slug, {
        sort,
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.pagination.page * lastPage.pagination.limit;
      return loaded < lastPage.pagination.total
        ? lastPage.pagination.page + 1
        : undefined;
    },
    enabled: Boolean(slug),
    retry: retryTransientPublicQuery,
  });
  const firstPage = query.data?.pages[0];
  const works = query.data?.pages.flatMap((page) => page.works) ?? [];
  const author = firstPage?.author;
  const sellerProfileId = author?.id;

  useTrackSellerView({
    sellerProfileId,
    sellerSlug: author?.slug ?? slug,
    enabled: Boolean(firstPage && sellerProfileId),
  });

  if (query.isLoading) {
    return (
      <AppShell>
        <PageState title="Загружаем работы автора…" loading />
      </AppShell>
    );
  }
  if (
    query.isError &&
    query.error instanceof ApiClientError &&
    query.error.kind === 'not_found'
  ) {
    return (
      <AppShell>
        <PageState title="Автор не найден" message="Профиль больше недоступен." />
      </AppShell>
    );
  }
  if (query.isError || !firstPage || !author) {
    return (
      <AppShell>
        <PageState
          title="Не удалось загрузить работы автора"
          retry={() => void query.refetch()}
        />
      </AppShell>
    );
  }

  const openTab = (nextTab: CreatorProfileTabId) => {
    push({
      pathname: '/seller/[slug]',
      params:
        nextTab === 'works'
          ? { slug, sort }
          : { slug, sort, tab: nextTab },
    } as Href);
  };

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: designTokens.space.x5,
          gap: designTokens.space.sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        <CreatorHero
          imageUrl={author.profilePhotoUrl}
          fullName={author.fullName}
          slug={author.slug}
          city={author.city}
          tags={authorDisciplineTags(author.discipline)}
        />
        <CreatorSocialActions
          telegramUrl={author.telegramUrl}
          instagramUrl={author.instagramUrl}
          websiteUrl={author.websiteUrl}
          onShare={() => setShareOpen(true)}
        />
        <View style={{ paddingHorizontal: designTokens.space.pageGutter }}>
          <CreatorProfileTabs
            activeTab={activeTab}
            worksCount={firstPage.pagination.total}
            onChange={openTab}
          />
        </View>
        <View
          style={{
            paddingHorizontal: designTokens.space.pageGutter,
            gap: designTokens.space.sectionGap,
          }}
        >
          {activeTab === 'about' ? (
            <View
              nativeID="creator-panel-about"
              style={{ gap: designTokens.space.sectionGap }}
            >
              <CreatorAboutSections
                biography={author.shortDescription}
                practice={author.practice}
              />
              <AchievementsTimeline
                records={toAchievementRecords(author.achievements)}
              />
            </View>
          ) : works.length === 0 ? (
            <View nativeID="creator-panel-works">
              <PageState title="У автора пока нет опубликованных работ" />
            </View>
          ) : (
            <View
              nativeID="creator-panel-works"
              style={{ gap: designTokens.space.sectionGap }}
            >
              {works.map((item) => (
                <WorkCoverCard
                  key={item.work.publicId}
                  href={`/product/${item.work.publicId}`}
                  imageUrl={item.work.images[0]?.url ?? ''}
                  imageLabel={item.work.title}
                  title={item.work.title}
                  authorSlug={item.author.slug}
                  mode="portfolio"
                />
              ))}
              {query.hasNextPage ? (
                <PrimaryButton
                  label="Смотреть все"
                  width="full"
                  loading={query.isFetchingNextPage}
                  onPress={() => void query.fetchNextPage()}
                />
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
      <ShareSheet
        open={shareOpen}
        url={publicShareUrl(author.sharePath)}
        onClose={() => setShareOpen(false)}
      />
    </AppShell>
  );
}
