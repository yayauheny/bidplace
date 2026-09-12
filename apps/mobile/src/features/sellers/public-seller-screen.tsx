import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import {
  AppText,
  MotionPressable,
  PageState,
  PrimaryButton,
  ResilientRemoteImage,
} from '../../components/ui';
import { AuthorAtmosphere } from '../../components/figma/AuthorAtmosphere';
import { WorkCoverCardGrid } from '../../components/figma/WorkCoverCardGrid';
import { FigmaChip } from '../../components/figma/FigmaChip';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { getApiAssetUrl } from '../../lib/environment';
import { useTrackSellerView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import { CreatorSocialLink } from './CreatorSocialLink';

import { AuthorShare } from './AuthorShare';
import { useAuthorWorks } from './use-author-works';
import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';

import { AuthorAbout } from './AuthorAbout';

import { type AuthorPublicTab } from './author-public-tabs';

export function PublicSellerScreen({
  slug,
  sort = 'newest',
}: {
  slug: string;
  sort?: 'newest' | 'oldest';
}) {
  const api = useApiClient();
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
      <AppShell>
        <PageState
          title="Не удалось загрузить работы автора"
          retry={() => void query.refetch()}
        />
      </AppShell>
    );
  }

  const tags = author.discipline
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

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
          <View
            testID="author-header"
            style={{
              overflow: 'hidden',
              paddingBottom: designTokens.space.authorHeaderBottom,
            }}
          >
            <AuthorAtmosphere
              imageUrl={author.profilePhotoUrl}
              fullName={author.fullName}
            />
            <View
              style={{
                alignItems: 'center',
                gap: designTokens.space.authorSectionGap,
                paddingHorizontal: designTokens.space.pageGutter,
                paddingTop: designTokens.space.authorLogoTop,
                zIndex: 1,
              }}
            >
              <View
                style={{
                  marginBottom:
                    designTokens.space.authorLogoGap -
                    designTokens.space.authorSectionGap,
                }}
              >
                <BrandLogo />
              </View>
              <View
                style={{
                  alignItems: 'center',
                  gap: designTokens.space.authorIdentityGap,
                }}
              >
                <ResilientRemoteImage
                  uri={getApiAssetUrl(author.profilePhotoUrl)}
                  component="AuthorPhoto"
                  accessibilityLabel={`Фото автора ${author.fullName}`}
                  fallbackLabel={`Фото автора недоступно: ${author.fullName}`}
                  style={{
                    width: designTokens.size.avatar,
                    height: designTokens.size.avatar,
                    borderRadius: designTokens.radius.avatar,
                  }}
                  contentFit="cover"
                />
                <View
                  style={{ alignItems: 'center', gap: designTokens.space.x1 }}
                >
                  <AppText role="profileHandle" style={{ textAlign: 'center' }}>
                    @{author.slug}
                  </AppText>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: designTokens.space.x2,
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                    }}
                  >
                    <AppText
                      role="profileMetadata"
                      style={{ textAlign: 'center' }}
                    >
                      {author.fullName}
                    </AppText>
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: designTokens.color.ink,
                      }}
                    />
                    <AppText role="profileMetadata">{author.city}</AppText>
                  </View>
                </View>
              </View>
              {tags.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: designTokens.space.authorChipGap,
                    marginBottom:
                      designTokens.space.socialGroupGap -
                      designTokens.space.authorSectionGap,
                  }}
                >
                  {tags.map((tag) => (
                    <FigmaChip
                      key={tag}
                      label={tag}
                      tone="onGlass"
                      size="profile"
                    />
                  ))}
                </View>
              ) : null}
              <View
                style={{
                  flexDirection: 'row',
                  gap: designTokens.space.socialGroupGap,
                }}
              >
                {author.telegramUrl ||
                author.instagramUrl ||
                author.websiteUrl ? (
                  <FigmaGlassSurface
                    preset="controlGroup"
                    testID="author-social-group"
                    contentStyle={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: designTokens.space.socialGroupGap,
                      paddingLeft: designTokens.space.socialGroupX,
                      paddingRight: designTokens.space.socialGroupX,
                      paddingTop: designTokens.space.socialGroupY,
                      paddingBottom: designTokens.space.socialGroupY,
                    }}
                  >
                    {author.telegramUrl ? (
                      <CreatorSocialLink
                        grouped
                        href={author.telegramUrl}
                        icon="send"
                        label="Telegram автора"
                      />
                    ) : null}
                    {author.instagramUrl ? (
                      <CreatorSocialLink
                        grouped
                        href={author.instagramUrl}
                        icon="instagram"
                        label="Instagram автора"
                      />
                    ) : null}
                    {author.websiteUrl ? (
                      <CreatorSocialLink
                        grouped
                        href={author.websiteUrl}
                        icon="globe"
                        label="Сайт автора"
                      />
                    ) : null}
                  </FigmaGlassSurface>
                ) : null}
                <AuthorShare sharePath={author.sharePath} />
              </View>
            </View>
          </View>

          <View
            style={{
              backgroundColor: designTokens.color.canvas,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 12,
              paddingHorizontal: designTokens.space.pageGutter,
              borderBottomWidth: 1,
              borderBottomColor: designTokens.color.divider,
            }}
          >
            <AuthorTabButton
              label="Работы"
              count={firstPage.pagination.total}
              selected={tab === 'works'}
              onPress={() => setTab('works')}
            />
            <AuthorTabButton
              label="Об авторе"
              selected={tab === 'about'}
              onPress={() => setTab('about')}
            />
          </View>

          <View
            testID="author-content"
            style={{
              backgroundColor: designTokens.color.canvas,
              paddingHorizontal: designTokens.space.pageGutter,
              paddingTop:
                tab === 'about'
                  ? designTokens.space.authorHeaderBottom
                  : designTokens.space.sectionGap,
              gap: designTokens.space.sectionGap,
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

function AuthorTabButton({
  label,
  count,
  selected,
  onPress,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <MotionPressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      preset="button"
      style={{
        paddingBottom: 4,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: designTokens.space.x1,
        borderBottomWidth: 2,
        borderBottomColor: selected ? designTokens.color.ink : 'transparent',
      }}
    >
      <AppText role="profileTab" tone={selected ? 'default' : 'secondary'}>
        {label}
      </AppText>
      {count !== undefined ? <AppText role="caption">{count}</AppText> : null}
    </MotionPressable>
  );
}
