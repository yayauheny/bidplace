import { useRef } from 'react';
import { FlatList, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  adminModerationFilterSchema,
  type AdminQueueQuery,
} from '@bidplace/contracts';
import type { ApiClient } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';
import { AppShell } from '../../components/layout';
import { useDockInset } from '../../components/layout/use-dock-inset';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import {
  AppText,
  MotionPressable,
  PageHeader,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { MediaDeliveryNotice } from '../../components/shared/MediaDeliveryNotice';
import { useApiClient } from '../../providers/api-provider';
import { useAppTheme } from '../../providers/theme-provider';
import {
  presentEnum,
  productStatusLabels,
  sellerStatusLabels,
} from '../../lib/presentation';
import { AdminReviewImage, AdminRevisionPhoto } from './AdminRevisionPhoto';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import { AdminUsersPanel } from './AdminUsersPanel';

type Summary = Awaited<
  ReturnType<ApiClient['admin']['listProductSummaries']>
>['items'][number];
const tabs = [
  { value: 'works', label: 'Работы' },
  { value: 'authors', label: 'Авторы' },
  { value: 'users', label: 'Пользователи' },
];
const filters = [
  { value: 'PENDING_REVIEW', label: 'На проверке' },
  { value: 'CHANGES_REQUESTED', label: 'Исправления' },
  { value: 'APPROVED', label: 'Одобрены' },
  { value: 'ALL', label: 'Все' },
];

export function AdminModerationScreen() {
  const api = useApiClient();
  const router = useRouter();
  const params = useLocalSearchParams<{
    section?: string;
    filter?: string;
    q?: string;
  }>();
  const section = tabs.some((tab) => tab.value === params.section)
    ? params.section!
    : 'works';
  const parsed = adminModerationFilterSchema.safeParse(
    params.filter ?? 'PENDING_REVIEW',
  );
  const filter = parsed.success ? parsed.data : 'PENDING_REVIEW';
  const search = params.q ?? '';
  const searchError = search.trim().length > 200;
  const { reserve } = useDockInset();
  const list = useRef<FlatList<Summary>>(null);
  const query = useInfiniteQuery({
    queryKey: ['admin', 'queue', section, filter, search.trim()],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => {
      const input: Partial<AdminQueueQuery> = {
        filter,
        search: search.trim() || undefined,
        limit: 15,
        includeCard: true,
        ...(pageParam ? { cursor: pageParam } : {}),
      };
      return section === 'authors'
        ? api.admin.listSellerSummaries(input, { signal })
        : api.admin.listProductSummaries(input, { signal });
    },
    enabled: section !== 'users' && !searchError,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const header = (
    <View
      style={{
        gap: designTokens.space.x4,
        paddingTop: designTokens.space.x4,
        paddingBottom: designTokens.space.x4,
      }}
    >
      <PageHeader title="Модерация" description="Проверка работ и авторов" />
      <AccountLogoutButton />
      <FigmaTabs
        selection
        tabs={tabs}
        value={section}
        onChange={(value) => {
          router.setParams({ section: value });
          list.current?.scrollToOffset({ offset: 0 });
        }}
        label="Раздел модерации"
        panelId="moderation-section"
      />
      {section !== 'users' ? (
        <>
          <TextField
            label="Поиск в очереди"
            value={search}
            onChangeText={(q) => router.setParams({ q })}
            error={searchError ? 'Поиск не длиннее 200 символов' : undefined}
          />
          <FigmaTabs
            selection
            tabs={filters}
            value={filter}
            onChange={(value) => {
              router.setParams({ filter: value });
              list.current?.scrollToOffset({ offset: 0 });
            }}
            label="Статус проверки"
            panelId="moderation-filter"
          />
          {filter === 'APPROVED' ? (
            <AppText role="bodySmall" tone="secondary">
              Одобренные сущности могут иметь новую редакцию на проверке.
            </AppText>
          ) : null}
        </>
      ) : null}
    </View>
  );
  return (
    <AppShell>
      <FlatList
        ref={list}
        keyExtractor={(item) => item.id}
        data={section === 'users' ? [] : items}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingBottom: reserve,
          gap: designTokens.space.x3,
          flexGrow: 1,
        }}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <QueueCard
            item={item}
            section={section === 'authors' ? 'authors' : 'products'}
          />
        )}
        ListEmptyComponent={
          section === 'users' ? (
            <AdminUsersPanel />
          ) : searchError ? null : query.isPending || query.isError ? (
            <InfrastructurePageStatus
              status={query.isError ? 'error' : 'loading'}
              onRetry={() => void query.refetch()}
            />
          ) : (
            <AppText role="body">Заявок по выбранным условиям нет.</AppText>
          )
        }
        ListFooterComponent={
          section !== 'users' ? (
            <View style={{ gap: designTokens.space.x3 }}>
              {query.isError && items.length ? (
                <AppText
                  role="bodySmall"
                  tone="danger"
                  accessibilityRole="alert"
                >
                  Не удалось обновить очередь. Загруженные заявки сохранены.
                </AppText>
              ) : null}
              {query.hasNextPage ? (
                <SecondaryButton
                  label={
                    query.isFetchNextPageError
                      ? 'Повторить загрузку'
                      : 'Загрузить ещё'
                  }
                  loading={query.isFetchingNextPage}
                  onPress={() => void query.fetchNextPage()}
                />
              ) : query.isError && items.length ? (
                <SecondaryButton
                  label="Повторить загрузку"
                  onPress={() => void query.refetch()}
                />
              ) : null}
            </View>
          ) : null
        }
      />
    </AppShell>
  );
}

function QueueCard({
  item,
  section,
}: {
  item: Summary;
  section: 'authors' | 'products';
}) {
  const palette = useAppTheme();
  const thumb = item.card?.thumbnail;
  const photoStyle = {
    width: 80,
    height: 104,
    borderRadius: designTokens.radius.image,
  };
  return (
    <Link
      href={{
        pathname:
          section === 'products'
            ? '/admin/products/[id]'
            : '/admin/authors/[id]',
        params: { id: item.id },
      }}
      asChild
    >
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={`Проверить: ${item.label ?? 'Без названия'}`}
        preset="card"
        style={{
          flexDirection: 'row',
          gap: designTokens.space.x3,
          padding: designTokens.space.x3,
          borderRadius: designTokens.radius.image,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surface,
        }}
      >
        {thumb?.kind === 'product-image' ? (
          <AdminReviewImage
            imageId={thumb.id}
            checksum={thumb.checksum}
            label={item.label ?? 'Работа'}
            fallbackLabel="Нет фото"
            style={photoStyle}
          />
        ) : thumb?.kind === 'seller-photo' ? (
          <AdminRevisionPhoto
            profileId={item.id}
            revisionId={thumb.revisionId}
            updatedAt={thumb.updatedAt}
            checksum={thumb.checksum}
            label={item.label ?? 'Автор'}
            style={photoStyle}
          />
        ) : (
          <View style={photoStyle}>
            <AppText role="caption" tone="secondary">
              Нет фото
            </AppText>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x1 }}>
          <AppText role="label" numberOfLines={2}>
            {item.label ?? 'Без названия'}
          </AppText>
          {item.card?.author ? (
            <AppText role="bodySmall" numberOfLines={1}>
              {item.card.author.fullName} · @{item.card.author.slug}
            </AppText>
          ) : null}
          <AppText role="caption" tone="secondary">
            {item.submittedAt
              ? new Date(item.submittedAt).toLocaleString('ru-RU')
              : 'Дата отправки неизвестна'}
          </AppText>
          <AppText role="bodySmall">
            {presentEnum(
              item.reviewStatus ?? item.parentStatus,
              section === 'products' ? productStatusLabels : sellerStatusLabels,
              'Статус неизвестен',
            )}
          </AppText>
          <AppText role="caption" tone="secondary">
            {item.card?.reviewKind === 'repeat'
              ? 'Повторная проверка'
              : item.card?.reviewKind === 'first'
                ? 'Первая публикация'
                : 'История публикации неизвестна'}
          </AppText>
          {item.card?.publication ? (
            <MediaDeliveryNotice delivery={item.card.publication} />
          ) : null}
        </View>
      </MotionPressable>
    </Link>
  );
}
