import { useId, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import { PageState, PrimaryButton } from '../../components/ui';
import { WorkCoverCardGrid } from '../../components/figma/WorkCoverCardGrid';
import { useTrackSellerView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';

import { useAuthorWorks } from './use-author-works';
import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';

import { AuthorAbout } from './AuthorAbout';
import { CreatorHeader } from './CreatorHeader';

import { type AuthorPublicTab } from './author-public-tabs';

export function PublicSellerScreen({
  slug,
  sort = 'newest',
}: {
  slug: string;
  sort?: 'newest' | 'oldest';
}) {
  const api = useApiClient();
  const panelId = useId();
  const [tab, setTab] = useState<AuthorPublicTab>('works');
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
  const { category, setCategory, categories, filtered } = useAuthorWorks(
    slug,
    sort,
  );
  const workQuery = category ? filtered : query;
  const firstPage = query.data?.pages[0];
  const works = workQuery.data?.pages.flatMap((page) => page.works) ?? [];
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
        <PageState
          title="Автор не найден"
          message="Профиль больше недоступен."
        />
      </AppShell>
    );
  }
  if (query.isError || !firstPage || !author) {
    return (
      <AppShell showSessionAlert={false}>
        <PageState
          title="Не удалось загрузить работы автора"
          retry={() => void query.refetch()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View style={{ flex: 1, position: 'relative', overflow: 'visible' }}>
        <ScrollView
          testID="creator-scroll"
          contentContainerStyle={{
            paddingBottom:
              tab === 'about'
                ? designTokens.size.dockReserve
                : designTokens.space.x5,
            overflow: 'visible',
          }}
          showsVerticalScrollIndicator={false}
        >
          <CreatorHeader
            profile={author}
            tabs={[
              {
                value: 'works',
                label: 'Работы',
                count: firstPage.pagination.total,
              },
              { value: 'about', label: 'Об авторе' },
            ]}
            tab={tab}
            onTabChange={(value) =>
              setTab(value === 'about' ? 'about' : 'works')
            }
            panelId={panelId}
          />

          <View
            testID="author-content"
            nativeID={panelId}
            role="tabpanel"
            aria-labelledby={`${panelId}-${tab}`}
            style={{
              backgroundColor: designTokens.color.canvas,
              paddingHorizontal: designTokens.space.pageGutter,
              paddingTop:
                tab === 'about'
                  ? designTokens.space.authorHeaderBottom
                  : designTokens.space.sectionGap,
              gap: designTokens.space.authorSectionGap,
            }}
          >
            {tab === 'works' ? (
              categories.isError ? (
                <PrimaryButton
                  label="Повторить загрузку категорий"
                  onPress={() => void categories.refetch()}
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: designTokens.space.x2 }}
                >
                  <FigmaChoiceChip
                    label="Все"
                    selected={!category}
                    onPress={() => setCategory(undefined)}
                  />
                  {categories.data?.categories.map((item) => (
                    <FigmaChoiceChip
                      key={item.id}
                      label={item.name}
                      selected={category === item.id}
                      onPress={() => setCategory(item.id)}
                    />
                  ))}
                </ScrollView>
              )
            ) : null}
            {tab === 'about' ? (
              <AuthorAbout author={author} />
            ) : workQuery.isLoading ? (
              <PageState title="Загружаем работы…" loading />
            ) : workQuery.isError ? (
              <PageState
                title="Не удалось загрузить работы"
                retry={() => void workQuery.refetch()}
              />
            ) : works.length === 0 ? (
              <PageState
                title={
                  category
                    ? 'В этой категории пока нет работ'
                    : 'У автора пока нет опубликованных работ'
                }
              />
            ) : (
              <>
                <WorkCoverCardGrid items={works} />
                {workQuery.hasNextPage ? (
                  <PrimaryButton
                    label="Смотреть все"
                    width="full"
                    loading={workQuery.isFetchingNextPage}
                    onPress={() => void workQuery.fetchNextPage()}
                  />
                ) : null}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </AppShell>
  );
}
