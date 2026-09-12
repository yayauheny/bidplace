import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Platform, ScrollView, View } from 'react-native';
import * as ExpoLinking from 'expo-linking';

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
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { getApiAssetUrl } from '../../lib/environment';
import { canonicalShareUrl } from '../../lib/canonical-share-url';
import { useTrackSellerView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import { CreatorSocialLink } from './CreatorSocialLink';

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
  const firstPage = query.data?.pages[0];
  const works = query.data?.pages.flatMap((page) => page.works) ?? [];
  const author = firstPage?.author;
  const sellerProfileId = author?.id;

  useTrackSellerView({
    sellerProfileId,
    sellerSlug: author?.slug ?? slug,
    enabled: Boolean(firstPage && sellerProfileId),
  });

  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );

  const copyProfileLink = () => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      !navigator.clipboard ||
      !author
    ) {
      setCopyState('error');
      return;
    }
    void navigator.clipboard
      .writeText(
        canonicalShareUrl(author.sharePath, undefined, ExpoLinking.createURL),
      )
      .then(() => setCopyState('success'))
      .catch(() => setCopyState('error'));
  };

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
            paddingBottom: designTokens.space.x5,
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
                <View style={{ alignItems: 'center' }}>
                  <AppText role="identityHandle">@{author.slug}</AppText>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: designTokens.space.x2,
                    }}
                  >
                    <AppText role="label">{author.fullName}</AppText>
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: designTokens.color.ink,
                      }}
                    />
                    <AppText role="label">{author.city}</AppText>
                  </View>
                </View>
              </View>
              {tags.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: designTokens.space.chipGap,
                  }}
                >
                  {tags.map((tag) => (
                    <FigmaChip key={tag} label={tag} tone="onGlass" />
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
                <FigmaGlassSurface
                  preset="controlGroup"
                  testID="author-share-group"
                  contentStyle={{
                    paddingLeft: designTokens.space.identityGap,
                    paddingRight: designTokens.space.identityGap,
                    paddingTop: designTokens.space.socialGroupY,
                    paddingBottom: designTokens.space.socialGroupY,
                  }}
                >
                  <MotionPressable
                    accessibilityRole="button"
                    accessibilityLabel="Скопировать ссылку на профиль"
                    onPress={copyProfileLink}
                    preset="icon"
                    style={{
                      width: designTokens.size.control,
                      height: designTokens.size.control,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: designTokens.radius.pill,
                    }}
                  >
                    <FigmaIcon
                      name="copy"
                      size={designTokens.size.socialGroupIcon}
                    />
                  </MotionPressable>
                </FigmaGlassSurface>
              </View>
              {copyState === 'success' ? (
                <AppText role="caption" tone="success">
                  Ссылка скопирована.
                </AppText>
              ) : null}
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
              label={`Работы ${firstPage.pagination.total}`}
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
              paddingTop: designTokens.space.sectionGap,
              gap: designTokens.space.sectionGap,
            }}
          >
            {tab === 'about' ? (
              <View style={{ gap: designTokens.space.x4 }}>
                <AppText role="body">{author.shortDescription}</AppText>
                {author.achievements.map((item) => (
                  <AppText key={item.id} role="bodySmall" tone="secondary">
                    {item.body}
                  </AppText>
                ))}
              </View>
            ) : works.length === 0 ? (
              <PageState title="У автора пока нет опубликованных работ" />
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

function AuthorTabButton({
  label,
  selected,
  onPress,
}: {
  label: string;
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
        borderBottomWidth: 1,
        borderBottomColor: selected ? designTokens.color.ink : 'transparent',
      }}
    >
      <AppText role="label" style={{ color: selected ? '#191919' : '#373737' }}>
        {label}
      </AppText>
    </MotionPressable>
  );
}
