import { useId, useState } from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { designTokens } from '@bidplace/design-tokens';

import { BackButton } from '../../components/figma/BackButton';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { FormPageShell } from '../../components/layout';
import { navigateBack } from '../../components/layout/navigate-back';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import { AppText, PageState, SecondaryButton } from '../../components/ui';
import { useSellerCapability } from '../../hooks/use-seller-capability';
import { sellerCommerceAccess } from './create-lot-form';
import { ATTENTION_LABEL } from './order-view';
import { OrderRow } from './OrderRow';
import { useAttention } from './use-order';
import { useDeals } from './use-deals';

export function DealsScreen() {
  const router = useRouter();
  const panelId = useId();
  const capability = useSellerCapability();
  const sales = sellerCommerceAccess(capability.status);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const activeRole = sales.viewSales ? role : 'buyer';
  const deals = useDeals(activeRole, true);
  const attention = useAttention();
  const loading =
    (deals.open.isLoading && !deals.open.data) ||
    (deals.closed.isLoading && !deals.closed.data);
  const failed = deals.open.isError || deals.closed.isError;
  return (
    <FormPageShell variant="account">
      <BackButton onPress={() => navigateBack(router, { fallbackHref: '/account' })} />
      <AppText role="sectionTitle">Сделки</AppText>
      {sales.viewSales ? (
        <FigmaTabs
          label="Сторона сделки"
          panelId={panelId}
          variant="segmented"
          appearance="plain"
          fill
          value={activeRole}
          tabs={[
            { value: 'buyer', label: 'Покупаю' },
            { value: 'seller', label: 'Продаю' },
          ]}
          onChange={(value) => setRole(value === 'seller' ? 'seller' : 'buyer')}
        />
      ) : null}
      <Attention
        items={attention.data?.items ?? []}
        onOpen={(publicId) => router.push(`/account/orders/${publicId}` as Href)}
        onContacts={() =>
          router.push(
            `/account/contacts?redirectTo=${encodeURIComponent('/account/deals')}` as Href,
          )
        }
      />
      {loading ? <InfrastructurePageStatus status="loading" onRetry={() => undefined} /> : null}
      {failed ? (
        <InfrastructurePageStatus
          status="error"
          onRetry={() => {
            void deals.open.refetch();
            void deals.closed.refetch();
          }}
        />
      ) : null}
      {!loading && !failed ? (
        <View style={{ gap: designTokens.space.x6 }}>
          <OrderGroup
            title="Открытые"
            orders={deals.open.data?.orders ?? []}
            empty={
              activeRole === 'buyer'
                ? 'Пока нет покупок. Работы с ценой и аукционы — в разделе Обзор'
                : sales.startSale
                  ? 'Пока нет продаж. Выставить работу можно на её странице'
                  : 'Пока нет продаж. Новая продажа недоступна, пока аккаунт приостановлен.'
            }
          />
          <OrderGroup
            title="Закрытые"
            orders={deals.closed.data?.orders ?? []}
            empty="Закрытых сделок нет"
          />
        </View>
      ) : null}
    </FormPageShell>
  );
}

function Attention({
  items,
  onOpen,
  onContacts,
}: {
  items: Array<{
    kind: keyof typeof ATTENTION_LABEL;
    orderPublicId: string | null;
  }>;
  onOpen: (publicId: string) => void;
  onContacts: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="label">Требует внимания</AppText>
      {items.map((item, index) =>
        item.orderPublicId ? (
          <SecondaryButton
            key={`${item.kind}-${item.orderPublicId}`}
            label={ATTENTION_LABEL[item.kind]}
            width="block"
            onPress={() => onOpen(item.orderPublicId ?? '')}
          />
        ) : item.kind === 'CONTACTS_REQUIRED' ? (
          <SecondaryButton
            key={item.kind}
            label={ATTENTION_LABEL.CONTACTS_REQUIRED}
            width="block"
            onPress={onContacts}
          />
        ) : (
          <AppText key={`${item.kind}-${index}`} role="bodySmall">
            {ATTENTION_LABEL[item.kind]}
          </AppText>
        ),
      )}
    </View>
  );
}

function OrderGroup({
  title,
  orders,
  empty,
}: {
  title: string;
  orders: Parameters<typeof OrderRow>[0]['order'][];
  empty: string;
}) {
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <AppText role="label">{title}</AppText>
      {orders.length === 0 ? <PageState title={empty} /> : null}
      {orders.map((order) => (
        <OrderRow key={order.publicId} order={order} />
      ))}
    </View>
  );
}
