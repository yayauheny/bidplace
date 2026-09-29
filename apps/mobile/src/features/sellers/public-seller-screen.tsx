import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell, navigateBack } from '../../components/layout';
import { InfrastructureErrorState } from '../../components/shared/InfrastructureErrorState';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import { PageState, PrimaryButton } from '../../components/ui';
import { WorkCoverCardGrid } from '../../components/figma/WorkCoverCardGrid';
import { useTrackSellerView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { categoryKeys } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';

import { useAuthorWorks } from './use-author-works';
import { authorWorksArePending } from './public-author-works-state';
import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';

import { AuthorAbout } from './AuthorAbout';
import { CreatorHeader } from './CreatorHeader';

import { type AuthorPublicTab } from './author-public-tabs';

export function PublicSellerScreen({
  slug,
  sort = 'newest',
  category,
}: {
  slug: string;
  sort?: 'newest' | 'oldest';
  category?: string;
}) {
  const api = useApiClient();
  const router = useRouter();
  const panelId = useId();
  const [tab, setTab] = useState<AuthorPublicTab>('works');
  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => api.categories.list({ signal }),
    retry: retryTransientPublicQuery,
  });
  const query = useAuthorWorks(
    slug,
    sort,
    category,
  );
  const firstPage = query.data?.pages[0];
  const works = query.data?.pages.flatMap((page) => page.works) ?? [];
  const author = firstPage?.author;
  const sellerProfileId = author?.id;
  const worksPending = authorWorksArePending(query);

  useTrackSellerView({
    sellerProfileId,
    sellerSlug: author?.slug ?? slug,
    enabled: Boolean(firstPage && sellerProfileId),
  });

  const pageStatus = infrastructurePageFetchStatus(query);
  if (
    query.isError &&
    pageStatus !== 'loading' &&
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
  if (pageStatus !== 'ready' || !firstPage || !author) {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status={pageStatus === 'loading' ? 'loading' : 'error'}
          onRetry={() => void query.refetch()}
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
            onBack={() => navigateBack(router, { fallbackHref: '/authors' })}
            tabs={[
              {
                value: 'works',
                label: 'Работы',
                count: query.isPlaceholderData
                  ? undefined
                  : firstPage.pagination.total,
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
                    onPress={() => router.setParams({ category: undefined })}
                  />
                  {categories.data?.categories.map((item) => (
                    <FigmaChoiceChip
                      key={item.id}
                      label={item.name}
                      selected={category === item.id}
                      onPress={() => router.setParams({ category: item.id })}
                    />
                  ))}
                </ScrollView>
              )
            ) : null}
            {tab === 'about' ? (
              <AuthorAbout author={author} />
            ) : worksPending ? (
              <PageState title="Загружаем работы…" loading />
            ) : query.isError ? (
              <InfrastructureErrorState
                presentation="inline"
                onRetry={() => void query.refetch()}
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
                {query.hasNextPage ? (
                  <PrimaryButton
                    label="Смотреть все"
                    width="full"
                    loading={query.isFetchingNextPage}
                    onPress={() => void query.fetchNextPage()}
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
