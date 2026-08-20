import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import type {
  PublicListingStatus,
  PublicSellerWorksQuery,
} from '@bidplace/contracts';
import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell, FilterMenu } from '../../components/layout';
import {
  AppText,
  AuctionCardGrid,
  PageState,
  SecondaryButton,
} from '../../components/ui';
import { useTrackSellerView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import { getAuthorWorkColumnCount } from './author-layout';
import { CreatorHero } from './CreatorHero';
import { CreatorStatusTabs } from './CreatorStatusTabs';

const sortOptions: Array<{
  value: PublicSellerWorksQuery['sort'];
  label: string;
}> = [
  { value: 'activity', label: 'По активности' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'priceAsc', label: 'Сначала дешевле' },
  { value: 'priceDesc', label: 'Сначала дороже' },
];

function CreatorSort({
  sort,
  onChange,
}: {
  sort: PublicSellerWorksQuery['sort'];
  onChange: (sort: PublicSellerWorksQuery['sort']) => void;
}) {
  return (
    <View style={{ alignSelf: 'flex-start', position: 'relative' }}>
      <FilterMenu
        variant="sort"
        label="Сортировка работ автора"
        value={sort}
        options={sortOptions}
        onSelect={(next) => {
          if (!next) return;
          onChange(next as PublicSellerWorksQuery['sort']);
        }}
        dropdownAlign="right"
        dropdownMinWidth={190}
        dismissOnOutside
      />
    </View>
  );
}

export function PublicSellerScreen({
  slug,
  status,
  sort = 'activity',
}: {
  slug: string;
  status?: PublicListingStatus;
  sort?: PublicSellerWorksQuery['sort'];
}) {
  const api = useApiClient();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const query = useInfiniteQuery({
    queryKey: ['public-seller', slug, { status, sort }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.sellers.getPublicDetail(slug, {
        status,
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
  const products = query.data?.pages.flatMap((page) => page.products) ?? [];
  const sellerProfileId = firstPage?.sellerProfile.id;

  useTrackSellerView({
    sellerProfileId,
    sellerSlug: firstPage?.sellerProfile.slug ?? slug,
    enabled: Boolean(firstPage && sellerProfileId),
  });

  let content: React.ReactNode;
  if (query.isLoading) {
    content = <PageState title="Загружаем работы автора…" loading />;
  } else if (
    query.isError &&
    query.error instanceof ApiClientError &&
    query.error.kind === 'not_found'
  ) {
    content = (
      <PageState title="Автор не найден" message="Профиль больше недоступен." />
    );
  } else if (query.isError || !firstPage) {
    content = (
      <PageState
        title="Не удалось загрузить работы автора"
        retry={() => void query.refetch()}
      />
    );
  } else if (products.length === 0) {
    content = <PageState title="У автора пока нет опубликованных работ" />;
  } else {
    content = (
      <View style={{ gap: designTokens.space.x5 }}>
        <AuctionCardGrid
          items={products}
          columns={getAuthorWorkColumnCount(width)}
        />
        {query.hasNextPage ? (
          <View style={{ alignItems: 'center', gap: designTokens.space.x2 }}>
            <SecondaryButton
              label="Загрузить ещё"
              loading={query.isFetchingNextPage}
              onPress={() => void query.fetchNextPage()}
            />
            {query.isFetchNextPageError ? (
              <AppText role="bodySmall" tone="danger">
                Не удалось загрузить следующую страницу.
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <AppShell ambientVariant="creator">
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: designTokens.space.x20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', alignSelf: 'center' }}>
          {firstPage ? (
            <CreatorHero profile={firstPage.sellerProfile} slug={slug} />
          ) : null}
          <View
            style={{
              gap: designTokens.space.x5,
              paddingTop: designTokens.space.x6,
              paddingHorizontal:
                width >= designTokens.breakpoint.desktopShell
                  ? designTokens.layout.creatorDesktopGutter
                  : designTokens.layout.mobileGutter,
              paddingBottom: designTokens.space.x12,
              backgroundColor: designTokens.color.surfaceWarm,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: designTokens.space.x4,
              }}
            >
              <AppText
                role="sectionTitle"
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 30,
                  lineHeight: 34,
                }}
              >
                Работы
              </AppText>
              <CreatorSort
                sort={sort}
                onChange={(nextSort) => router.setParams({ sort: nextSort })}
              />
            </View>
            {firstPage ? (
              <CreatorStatusTabs
                status={status}
                statusCounts={firstPage.statusCounts}
                onChange={(nextStatus) =>
                  router.setParams({ status: nextStatus, sort })
                }
              />
            ) : null}
            <View nativeID="creator-works-panel" role="tabpanel">
              {content}
            </View>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
