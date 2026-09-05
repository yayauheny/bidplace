import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { ApiClient } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { FormPageShell } from '../../components/layout';
import {
  AppText,
  MotionPressable,
  PageHeader,
  PageState,
  SecondaryButton,
} from '../../components/ui';
import { formatCurrencyAmount, formatDateTime } from '../../lib/formatters';
import { orderStatusLabels, presentEnum } from '../../lib/presentation';
import { useApiClient } from '../../providers/api-provider';

type SellerOrder = Awaited<
  ReturnType<ApiClient['orders']['list']>
>['orders'][number];

function orderStatusTone(
  status: SellerOrder['order']['status'],
): 'accent' | 'success' | 'secondary' | 'danger' {
  if (status === 'COMPLETED' || status === 'CONTACTED') return 'success';
  if (status === 'HANDOFF_FAILED') return 'danger';
  if (status === 'PENDING_CONTACT') return 'accent';
  return 'secondary';
}

function SellerOrderRow({ item }: { item: SellerOrder }) {
  return (
    <View
      style={{
        gap: designTokens.space.x3,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        borderRadius: designTokens.radius.panel,
        backgroundColor: designTokens.color.surfaceWarm,
        padding: designTokens.space.x5,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: designTokens.space.x3,
        }}
      >
        <Link
          href={{
            pathname: '/order/[publicId]',
            params: { publicId: item.order.publicId },
          }}
          asChild
        >
          <MotionPressable
            accessibilityRole="link"
            accessibilityLabel={`Открыть сделку ${item.productSummary.title}`}
            onPress={() => undefined}
            preset="card"
            style={{ flex: 1, minWidth: 0, gap: designTokens.space.x1 }}
          >
            <AppText role="cardTitle">{item.productSummary.title}</AppText>
            <AppText role="metadata" tone="secondary">
              {formatCurrencyAmount(
                item.order.finalAmount,
                item.order.currency,
              )}{' '}
              · до {formatDateTime(item.order.contactDueAt)}
            </AppText>
            <AppText role="metadata" tone="secondary">
              {item.buyerEmailAtClose}
            </AppText>
          </MotionPressable>
        </Link>
        <AppText
          role="caption"
          tone={orderStatusTone(item.order.status)}
          style={{
            backgroundColor: designTokens.color.chip,
            borderRadius: designTokens.radius.pill,
            overflow: 'hidden',
            paddingHorizontal: designTokens.space.x2,
            paddingVertical: designTokens.space.x1,
          }}
        >
          {presentEnum(
            item.order.status,
            orderStatusLabels,
            'Неизвестный статус заказа',
          )}
        </AppText>
      </View>
      <Link
        href={{
          pathname: '/order/[publicId]',
          params: { publicId: item.order.publicId },
        }}
        asChild
      >
        <SecondaryButton
          label="Открыть сделку"
          width="block"
          onPress={() => undefined}
        />
      </Link>
    </View>
  );
}

export function SellerOrdersScreen() {
  const api = useApiClient();
  const query = useInfiniteQuery({
    queryKey: ['seller', 'orders'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.orders.list({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.pagination.page * lastPage.pagination.limit;
      return loaded < lastPage.pagination.total
        ? lastPage.pagination.page + 1
        : undefined;
    },
  });
  const orders = query.data?.pages.flatMap((page) => page.orders) ?? [];

  let content: ReactNode;
  if (query.isLoading) {
    content = <PageState title="Загружаем сделки…" loading />;
  } else if (query.isError) {
    content = (
      <PageState
        title="Не удалось загрузить сделки"
        retry={() => void query.refetch()}
      />
    );
  } else if (orders.length === 0) {
    content = (
      <PageState
        title="Пока нет сделок"
        message="Здесь появятся сделки после завершения торгов."
      />
    );
  } else {
    content = (
      <View style={{ gap: designTokens.space.x4 }}>
        {orders.map((item) => (
          <SellerOrderRow key={item.order.publicId} item={item} />
        ))}
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
    <FormPageShell maxWidth={760}>
      <PageHeader
        title="Сделки"
        description="Заказы по вашим завершённым торгам."
      />
      {content}
    </FormPageShell>
  );
}
