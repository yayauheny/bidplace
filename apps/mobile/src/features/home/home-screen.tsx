import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AuthorCoverCard } from '../../components/figma/AuthorCoverCard';
import { CuratorFeature } from '../../components/figma/CuratorFeature';
import { WorkCoverCard } from '../../components/figma/WorkCoverCard';
import { BrandLogo } from '../../components/layout/BrandLogo';
import { AppShell } from '../../components/layout';
import { PageState, PrimaryButton } from '../../components/ui';
import { AppText } from '../../components/ui/AppText';
import { useApiClient } from '../../providers/api-provider';
import {
  authorDisciplineTags,
  isHomeEmpty,
  shouldRenderCuratorFeature,
} from './home-composition';

function HomeCoverRail({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: designTokens.space.sectionGap, width: '100%' }}>
      <AppText
        role="sectionTitle"
        style={{ paddingHorizontal: designTokens.space.pageGutter }}
      >
        {title}
      </AppText>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: designTokens.space.pageGutter,
          paddingHorizontal: designTokens.space.pageGutter,
        }}
      >
        {children}
      </ScrollView>
      <View style={{ paddingHorizontal: designTokens.space.pageGutter }}>
        <PrimaryButton label={actionLabel} width="full" onPress={onAction} />
      </View>
    </View>
  );
}

export function HomeScreen() {
  const api = useApiClient();
  const { push } = useRouter();
  const home = useQuery({
    queryKey: ['portfolio-home'],
    queryFn: () => api.portfolio.home(),
  });
  const loading = home.isLoading;
  const failed = home.isError;
  const curatorSelection = home.data?.curatorSelection ?? null;
  const newWorks = home.data?.newWorks ?? [];
  const newAuthors = home.data?.newAuthors ?? [];
  const showCurator = shouldRenderCuratorFeature(curatorSelection);
  const empty =
    !loading &&
    !failed &&
    isHomeEmpty({
      curatorSelection,
      newWorksCount: newWorks.length,
      newAuthorsCount: newAuthors.length,
    });

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          paddingTop: designTokens.space.x6,
          paddingBottom: designTokens.space.x5,
          gap: designTokens.space.sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center' }}>
          <BrandLogo />
        </View>
        {loading ? <PageState title="Загружаем bidplace…" loading /> : null}
        {failed ? (
          <PageState
            title="Не удалось загрузить главную"
            retry={() => {
              void home.refetch();
            }}
          />
        ) : null}
        {!loading && !failed && showCurator ? (
          <CuratorFeature selection={curatorSelection} />
        ) : null}
        {!loading && !failed && newWorks.length > 0 ? (
          <HomeCoverRail
            title="Новые работы"
            actionLabel="Смотреть все"
            onAction={() => push('/works')}
          >
            {newWorks.map((item) => (
              <View
                key={item.work.publicId}
                style={{ width: designTokens.size.coverWidth }}
              >
                <WorkCoverCard
                  href={`/product/${item.work.publicId}`}
                  imageUrl={item.work.images[0]?.url ?? ''}
                  imageLabel={item.work.title}
                  title={item.work.title}
                  authorSlug={item.author.slug}
                  mode="portfolio"
                />
              </View>
            ))}
          </HomeCoverRail>
        ) : null}
        {!loading && !failed && newAuthors.length > 0 ? (
          <HomeCoverRail
            title="Авторы"
            actionLabel="Смотреть всех"
            onAction={() => push('/authors')}
          >
            {newAuthors.map((author) => (
              <View
                key={author.slug}
                style={{ width: designTokens.size.coverWidth }}
              >
                <AuthorCoverCard
                  fullName={author.fullName}
                  slug={author.slug}
                  tags={authorDisciplineTags(author.discipline)}
                  imageUrl={author.profilePhotoUrl}
                />
              </View>
            ))}
          </HomeCoverRail>
        ) : null}
        {empty ? (
          <View style={{ gap: designTokens.space.sectionGap }}>
            <PageState
              title="Пока здесь тихо"
              message="Новые работы и авторы появятся после публикации."
            />
            <View style={{ paddingHorizontal: designTokens.space.pageGutter }}>
              <PrimaryButton
                label="Все работы"
                width="full"
                onPress={() => push('/works')}
              />
            </View>
            <View style={{ paddingHorizontal: designTokens.space.pageGutter }}>
              <PrimaryButton
                label="Все авторы"
                width="full"
                onPress={() => push('/authors')}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}
