import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell, navigateBack } from '../../components/layout';
import { InfrastructureErrorState } from '../../components/shared/InfrastructureErrorState';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { infrastructurePageFetchStatus } from '../../components/shared/infrastructure-page-status';
import { AppDialog } from '../../components/ui/AppDialog';
import { AppText, MotionPressable, PageState, PrimaryButton } from '../../components/ui';
import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useTrackSellerView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { categoryKeys } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';

import { useAuthorWorks } from './use-author-works';
import { authorWorksArePending } from './public-author-works-state';
import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { FigmaIcon } from '../../components/figma/FigmaIcon';

import { AuthorAbout } from './AuthorAbout';
import { CreatorWorkCard } from './CreatorWorkCard';
import { invalidateOwnerWorks } from './owner-work-query';
import { CreatorHeader } from './CreatorHeader';

import { type AuthorPublicTab } from './author-public-tabs';

export function PublicSellerScreen({
  slug,
  sort = 'newest',
  category,
  categoryIds,
}: {
  slug: string;
  sort?: 'newest' | 'oldest';
  category?: string;
  categoryIds?: string[];
}) {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const capability = useSellerCapability();
  const panelId = useId();
  const [tab, setTab] = useState<AuthorPublicTab>('works');
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [pendingHide, setPendingHide] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const selectedCategories = categoryIds?.length ? categoryIds : category ? [category] : [];
  const [draftCategories, setDraftCategories] = useState<string[]>(selectedCategories);
  const categories = useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => api.categories.list({ signal }),
    retry: retryTransientPublicQuery,
  });
  const query = useAuthorWorks(
    slug,
    sort,
    category,
    categoryIds,
  );
  const firstPage = query.data?.pages[0];
  const works = query.data?.pages.flatMap((page) => page.works) ?? [];
  const author = firstPage?.author;
  const sellerProfileId = author?.id;
  const worksPending = authorWorksArePending(query);
  const isOwner = Boolean(author && capability.profile?.slug === author.slug && capability.status === 'APPROVED');
  const hideWork = useMutation({
    mutationFn: (id: string) => api.portfolio.hideWork(id),
    onSuccess: () => {
      setPendingHide(null);
      void queryClient.invalidateQueries({ queryKey: ['public-author', slug] });
      void queryClient.invalidateQueries({ queryKey: ['portfolio-home'] });
      void invalidateOwnerWorks(queryClient);
    },
  });

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
            paddingBottom: designTokens.size.dockReserve,
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
            isOwner={isOwner}
            onUnavailable={setUnavailable}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
                  <FigmaButton
                    label="Категория"
                    icon="arrow-right-01"
                    iconPosition="right"
                    variant="outline"
                    disabled={!categories.data}
                    onPress={() => {
                      setDraftCategories(selectedCategories);
                      setFilterOpen(true);
                    }}
                  />
                  {selectedCategories.map((id) => (
                    <FigmaChoiceChip
                      key={id}
                      label={categories.data?.categories.find((item) => item.id === id)?.name ?? 'Категория'}
                      selected
                      removable
                      onPress={() => {
                        setDraftCategories(selectedCategories);
                        setFilterOpen(true);
                      }}
                      onRemove={() => {
                        const next = selectedCategories.filter((current) => current !== id);
                        router.setParams({ categories: next.length ? next.join(',') : undefined, category: undefined });
                      }}
                    />
                  ))}
                </View>
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
                  selectedCategories.length
                    ? 'В выбранных категориях пока нет работ'
                    : 'У автора пока нет опубликованных работ'
                }
              />
            ) : (
              <>
                <View style={{ width: '100%', gap: designTokens.space.sectionGap }}>
                  {works.map((item) => (
                    <CreatorWorkCard
                      key={item.work.publicId}
                      item={item}
                      isOwner={isOwner}
                      onUnavailable={setUnavailable}
                      onHide={setPendingHide}
                    />
                  ))}
                </View>
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
        <AppDialog
          presentation="sheet"
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          title="Категория"
        >
          <View style={{ gap: designTokens.space.x2 }}>
            {[
              ...(categories.data?.categories ?? []),
            ].map((item) => {
              const selected = draftCategories.includes(item.id);
              return (
                <MotionPressable
                  key={item.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={item.name}
                  onPress={() => setDraftCategories((current) => selected
                    ? current.filter((id) => id !== item.id)
                    : current.length < 20 ? [...current, item.id] : current)}
                  preset="button"
                  style={{
                    minHeight: designTokens.size.touch,
                    paddingVertical: designTokens.space.x3,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <AppText role="bodySmall">{item.name}</AppText>
                  {selected ? <FigmaIcon name="check" size={20} /> : null}
                </MotionPressable>
              );
            })}
            <PrimaryButton
              label="Показать работы"
              width="full"
              onPress={() => {
                router.setParams({ categories: draftCategories.length ? draftCategories.join(',') : undefined, category: undefined });
                setFilterOpen(false);
              }}
            />
          </View>
        </AppDialog>
        <AppDialog
          open={Boolean(unavailable)}
          title="Скоро появится"
          onClose={() => setUnavailable(null)}
        >
          <AppText role="bodySmall">
            {unavailable} пока недоступны. Мы добавим эту возможность позже.
          </AppText>
          <PrimaryButton label="Понятно" onPress={() => setUnavailable(null)} />
        </AppDialog>
        <AppDialog
          open={Boolean(pendingHide)}
          title="Скрыть работу?"
          description="Работа исчезнет из публичного профиля и останется доступна в кабинете."
          onClose={() => setPendingHide(null)}
        >
          {hideWork.isError ? (
            <AppText role="bodySmall" tone="danger">
              Не удалось скрыть работу. Повторите попытку.
            </AppText>
          ) : null}
          <PrimaryButton
            label="Скрыть"
            loading={hideWork.isPending}
            disabled={!pendingHide || hideWork.isPending}
            onPress={() => {
              if (pendingHide) hideWork.mutate(pendingHide);
            }}
          />
        </AppDialog>
      </View>
    </AppShell>
  );
}
