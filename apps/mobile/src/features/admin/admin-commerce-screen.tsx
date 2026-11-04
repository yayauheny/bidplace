import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import {
  type AdminOrderOutcomeRequest,
  type AdminReport,
  type OrderDetail,
  ORDER_FAIL_REASONS,
} from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import { useDockInset } from '../../components/layout/use-dock-inset';
import {
  AppText,
  PageHeader,
  SecondaryButton,
  TextButton,
  TextField,
} from '../../components/ui';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import { adminKeys, canWritePrivateCache, currentAuthEpoch } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import {
  banUserByEmail,
  FAIL_CHOICES,
  FAULT_CHOICES,
  commerceActionMessage,
  orderOutcomeBody,
  releaseHoldBody,
  removeListingBody,
  reportQueueItem,
  requiredReason,
  resolveReportBody,
} from './admin-commerce-actions';

const failLabels: Record<(typeof ORDER_FAIL_REASONS)[number], string> = {
  BUYER_REFUSED: 'Покупатель отказался',
  BUYER_NO_CONTACT: 'Нет контакта',
  BUYER_INVALID_CONTACTS: 'Контакты неверные',
  SELLER_REFUSED: 'Автор отказался',
  OFFER_DECLINED: 'Предложение отклонено',
  OFFER_EXPIRED: 'Предложение истекло',
  ADMIN_CANCELLED: 'Отмена администратором',
};

const faultLabels = {
  BUYER: 'Вина покупателя',
  SELLER: 'Вина автора',
  NONE: 'Без вины',
} as const;

function ContactLines({
  title,
  contacts,
}: {
  title: string;
  contacts: OrderDetail['buyerContacts'];
}) {
  return (
    <View style={{ gap: designTokens.space.x1 }}>
      <AppText role="bodySmall">{title}</AppText>
      {contacts ? (
        <View style={{ gap: designTokens.space.x1 }}>
          <AppText role="bodySmall">{contacts.email}</AppText>
          {contacts.phone ? (
            <AppText role="bodySmall">{contacts.phone}</AppText>
          ) : null}
          {contacts.telegram ? (
            <AppText role="bodySmall">{contacts.telegram}</AppText>
          ) : null}
          {contacts.instagram ? (
            <AppText role="bodySmall">{contacts.instagram}</AppText>
          ) : null}
          {contacts.vk ? <AppText role="bodySmall">{contacts.vk}</AppText> : null}
        </View>
      ) : (
        <AppText role="bodySmall" tone="secondary">
          Контакты скрыты
        </AppText>
      )}
    </View>
  );
}

export function AdminCommerceScreen() {
  const api = useApiClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { reserve } = useDockInset();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  function ownsAction(epoch: number) {
    return mounted.current && canWritePrivateCache(queryClient, epoch);
  }
  const loginSent = useRef(false);
  const busyRef = useRef(false);
  const [reason, setReason] = useState('');
  const [fault, setFault] = useState<(typeof FAULT_CHOICES)[number] | ''>('');
  const [failReason, setFailReason] = useState<
    (typeof FAIL_CHOICES)[number] | ''
  >('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reasonReady = requiredReason(reason) !== null;

  const health = useQuery({
    queryKey: adminKeys.commerce('health'),
    queryFn: ({ signal }) => api.commerce.getAdminHealth({ signal }),
    retry: false,
  });
  const reports = useQuery({
    queryKey: adminKeys.commerce('reports'),
    queryFn: ({ signal }) =>
      api.commerce.listReports({ status: 'OPEN' }, { signal }),
    retry: false,
  });
  const attention = useQuery({
    queryKey: adminKeys.commerce('attention'),
    queryFn: ({ signal }) => api.commerce.getAdminAttention({ signal }),
    retry: false,
  });
  const order = useQuery({
    queryKey: adminKeys.commerce(`order:${orderId ?? 'none'}`),
    queryFn: ({ signal }) => api.commerce.getOrder(orderId ?? '', { signal }),
    enabled: orderId !== null,
    retry: false,
  });
  const lot = useQuery({
    queryKey: adminKeys.commerce(`lot:${order.data?.workPublicId ?? 'none'}`),
    queryFn: ({ signal }) =>
      api.commerce.getLot(order.data?.workPublicId ?? '', { signal }),
    enabled: Boolean(order.data?.workPublicId),
    retry: false,
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: adminKeys.commerceRoot });
  }

  async function run(action: () => Promise<unknown>, success: string) {
    const epoch = currentAuthEpoch(queryClient);
    if (busyRef.current || !ownsAction(epoch)) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const message = await action();
      if (!ownsAction(epoch)) return;
      setReason('');
      setNotice(typeof message === 'string' ? message : success);
      await refresh();
    } catch (error) {
      if (!ownsAction(epoch)) return;
      setNotice(commerceActionMessage(error));
      if (
        error instanceof ApiClientError &&
        (error.status === 401 || error.status === 403 || error.status === 409)
      ) {
        await refresh();
      }
      if (
        error instanceof ApiClientError &&
        error.status === 401 &&
        ownsAction(epoch) &&
        !loginSent.current
      ) {
        loginSent.current = true;
        router.push({
          pathname: '/login',
          params: { redirectTo: '/admin/commerce' },
        });
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function resolve(report: AdminReport, status: 'UPHELD' | 'REJECTED') {
    const body = resolveReportBody({
      status,
      faultSide: fault,
      adminNote: reason,
    });
    if (!body) {
      setNotice(
        status === 'UPHELD'
          ? 'Для подтверждения выберите сторону вины и причину.'
          : 'Укажите причину.',
      );
      return;
    }
    void run(
      () => api.commerce.resolveReport(report.id, body),
      status === 'UPHELD' ? 'Жалоба подтверждена.' : 'Жалоба отклонена.',
    );
  }

  function ban(userId: string) {
    const note = requiredReason(reason);
    if (!note) {
      setNotice('Укажите причину.');
      return;
    }
    void run(
      () => api.commerce.banUser(userId, { reason: note }),
      'Пользователь заблокирован.',
    );
  }

  async function banByEmail(email: string | undefined) {
    const note = requiredReason(reason);
    if (!email || !note) {
      setNotice('Укажите причину. Без адреса блокировка не отправляется.');
      return;
    }
    const epoch = currentAuthEpoch(queryClient);
    if (busyRef.current || !ownsAction(epoch)) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const banned = await banUserByEmail(api, email, note, () => ownsAction(epoch));
      if (!ownsAction(epoch) || banned === null) return;
      if (!banned) {
        setNotice('По этому адресу нет одного пользователя. Блокировка не отправлена.');
        return;
      }
      setReason('');
      setNotice('Пользователь заблокирован.');
      await refresh();
    } catch (error) {
      if (!ownsAction(epoch)) return;
      setNotice(commerceActionMessage(error));
      if (error instanceof ApiClientError && error.status === 401 && !loginSent.current) {
        loginSent.current = true;
        router.push({
          pathname: '/login',
          params: { redirectTo: '/admin/commerce' },
        });
      }
      if (
        error instanceof ApiClientError &&
        (error.status === 401 || error.status === 403 || error.status === 409)
      ) {
        await refresh();
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  const failed =
    health.isError || reports.isError || attention.isError
      ? 'Не удалось загрузить сделки и жалобы.'
      : null;

  return (
    <AppShell>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          gap: designTokens.space.x4,
          paddingTop: designTokens.space.x4,
          paddingBottom: reserve,
        }}
      >
        <PageHeader
          title="Сделки и жалобы"
          description="Очередь жалоб, сделки без исхода и служебные действия"
        />
        <TextButton label="К модерации" onPress={() => router.push('/admin')} />
        <AccountLogoutButton />
        <AppText role="bodySmall" tone="secondary">
          Недельные цифры на этом экране не считаются.
        </AppText>
        {health.data ? (
          <View style={{ gap: designTokens.space.x1 }}>
            <AppText role="bodySmall">
              {`Последний тик: ${health.data.lastTickAt ?? 'нет'}.`}
            </AppText>
            <AppText role="bodySmall">
              {`Открытых жалоб: ${health.data.openReports}. Живых аукционов: ${health.data.liveAuctions}.`}
            </AppText>
            <AppText role="bodySmall">
              {`Неотправленных писем: ${health.data.failedNotifications}.`}
            </AppText>
            {health.data.liveAuctions > 0 && !health.data.cronConfigured ? (
              <AppText role="bodySmall" tone="danger">
                Идут аукционы, а Cron выключен.
              </AppText>
            ) : null}
            <SecondaryButton
              label="Повторить"
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  const result = await api.commerce.retryFailedNotifications();
                  return `Повторно поставлено писем: ${result.retried}.`;
                }, 'Повтор писем запущен.')
              }
            />
          </View>
        ) : null}
        {failed ? (
          <View style={{ gap: designTokens.space.x2 }}>
            <AppText role="bodySmall" tone="danger">
              {failed}
            </AppText>
            <SecondaryButton
              label="Повторить загрузку"
              onPress={() => {
                void health.refetch();
                void reports.refetch();
                void attention.refetch();
              }}
            />
          </View>
        ) : null}
        {health.isPending || reports.isPending || attention.isPending ? (
          <AppText role="bodySmall">Загрузка</AppText>
        ) : null}
        <TextField
          label="Причина или заметка"
          value={reason}
          onChangeText={setReason}
          editable={!busy}
        />
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="bodySmall">Сторона вины для подтверждения жалобы</AppText>
          {FAULT_CHOICES.map((choice) => (
            <SecondaryButton
              key={choice}
              label={fault === choice ? `${faultLabels[choice]} · выбрано` : faultLabels[choice]}
              disabled={busy}
              onPress={() => setFault(choice)}
            />
          ))}
        </View>
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="bodySmall">Причина неуспеха сделки</AppText>
          {FAIL_CHOICES.map((choice) => (
            <SecondaryButton
              key={choice}
              label={
                failReason === choice
                  ? `${failLabels[choice]} · выбрано`
                  : failLabels[choice]
              }
              disabled={busy}
              onPress={() => setFailReason(choice)}
            />
          ))}
        </View>
        {notice ? <AppText role="bodySmall">{notice}</AppText> : null}
        <AppText role="sectionTitle">Открытые жалобы</AppText>
        <AppText role="bodySmall" tone="secondary">
          В списке жалоб контакты сделки не показываются.
        </AppText>
        {(reports.data?.reports ?? []).map((report) => {
          const row = reportQueueItem(report);
          return (
            <View key={row.id} style={{ gap: designTokens.space.x2 }}>
              <AppText role="bodySmall">{`${row.orderPublicId} · ${row.reason}`}</AppText>
              {row.text ? <AppText role="bodySmall">{row.text}</AppText> : null}
              <SecondaryButton
                label="Открыть сделку"
                disabled={busy}
                onPress={() => setOrderId(row.orderPublicId)}
              />
              <SecondaryButton
                label="Признать"
                disabled={busy || !reasonReady || fault === ''}
                onPress={() => resolve(report, 'UPHELD')}
              />
              <SecondaryButton
                label="Отклонить"
                disabled={busy || !reasonReady}
                onPress={() => resolve(report, 'REJECTED')}
              />
              <SecondaryButton
                label="Заблокировать покупателя"
                disabled={busy || !reasonReady}
                onPress={() => ban(row.buyerUserId)}
              />
              <SecondaryButton
                label="Заблокировать автора"
                disabled={busy || !reasonReady}
                onPress={() => ban(row.sellerUserId)}
              />
            </View>
          );
        })}
        {reports.data && reports.data.reports.length === 0 ? (
          <AppText role="bodySmall">Открытых жалоб нет.</AppText>
        ) : null}
        <AppText role="sectionTitle">Жалобы на сделки</AppText>
        {(attention.data?.reportedOrders ?? []).map((item) => (
          <OrderCard
            key={`reported-${item.publicId}`}
            order={item}
            busy={busy}
            onOpen={() => setOrderId(item.publicId)}
          />
        ))}
        {attention.data && attention.data.reportedOrders.length === 0 ? (
          <AppText role="bodySmall">Споров нет.</AppText>
        ) : null}
        <AppText role="sectionTitle">Сделки без исхода дольше 72 часов</AppText>
        {(attention.data?.unmarkedOrders ?? []).map((item) => (
          <OrderCard
            key={`unmarked-${item.publicId}`}
            order={item}
            busy={busy}
            onOpen={() => setOrderId(item.publicId)}
          />
        ))}
        {attention.data && attention.data.unmarkedOrders.length === 0 ? (
          <AppText role="bodySmall">Таких сделок нет.</AppText>
        ) : null}
        <AppText role="sectionTitle">Антифрод-удержания</AppText>
        {(attention.data?.blocks ?? []).map((block) => (
          <View key={block.id} style={{ gap: designTokens.space.x2 }}>
            <AppText role="bodySmall">{block.email}</AppText>
            <SecondaryButton
              label="Снять блок"
              disabled={busy || releaseHoldBody(reason) === null}
              onPress={() => {
                const body = releaseHoldBody(reason);
                if (!body) return;
                void run(
                  () => api.admin.releaseHold(block.id, body),
                  'Блок снят.',
                );
              }}
            />
          </View>
        ))}
        {attention.data && attention.data.blocks.length === 0 ? (
          <AppText role="bodySmall">Удержаний нет.</AppText>
        ) : null}
        {orderId ? (
          <View style={{ gap: designTokens.space.x2 }}>
            <AppText role="sectionTitle">Сделка</AppText>
            {order.isPending ? <AppText role="bodySmall">Загрузка сделки</AppText> : null}
            {order.isError ? (
              <SecondaryButton label="Повторить сделку" onPress={() => void order.refetch()} />
            ) : null}
            {lot.isError ? (
              <SecondaryButton label="Повторить лот" onPress={() => void lot.refetch()} />
            ) : null}
            {order.data ? (
              <OrderActions
                order={order.data}
                lotId={lot.data?.id ?? null}
                lotKnown={lot.isSuccess}
                busy={busy}
                reasonReady={reasonReady}
                failReason={failReason}
                reason={reason}
                onOutcome={(publicId, body) =>
                  void run(
                    () => api.commerce.setOrderOutcome(publicId, body),
                    'Исход записан.',
                  )
                }
                onVoid={(publicId, note) =>
                  void run(
                    () => api.commerce.voidOrderStrike(publicId, { reason: note }),
                    'Страйк снят.',
                  )
                }
                onBanBuyer={(email) => void banByEmail(email)}
                onBanSeller={(email) => void banByEmail(email)}
                onRemove={(listingId, body) =>
                  void run(
                    () => api.commerce.removeListing(listingId, body),
                    'Лот снят.',
                  )
                }
                onInvalid={() =>
                  setNotice('Укажите причину и, для неуспеха, основание.')
                }
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

function OrderCard({
  order,
  busy,
  onOpen,
}: {
  order: OrderDetail;
  busy: boolean;
  onOpen: () => void;
}) {
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="bodySmall">{`${order.publicId} · ${order.workTitle}`}</AppText>
      <AppText role="bodySmall">{order.status}</AppText>
      <ContactLines title="Покупатель" contacts={order.buyerContacts} />
      <ContactLines title="Автор" contacts={order.sellerContacts} />
      <SecondaryButton label="Открыть" disabled={busy} onPress={onOpen} />
    </View>
  );
}

function OrderActions({
  order,
  lotId,
  lotKnown,
  busy,
  reasonReady,
  failReason,
  reason,
  onOutcome,
  onVoid,
  onBanBuyer,
  onBanSeller,
  onRemove,
  onInvalid,
}: {
  order: OrderDetail;
  lotId: string | null;
  lotKnown: boolean;
  busy: boolean;
  reasonReady: boolean;
  failReason: (typeof FAIL_CHOICES)[number] | '';
  reason: string;
  onOutcome: (publicId: string, body: AdminOrderOutcomeRequest) => void;
  onVoid: (publicId: string, reason: string) => void;
  onBanBuyer: (email: string) => void;
  onBanSeller: (email: string) => void;
  onRemove: (listingId: string, body: { reason: string }) => void;
  onInvalid: () => void;
}) {
  function outcome(to: 'COMPLETED' | 'FAILED') {
    const body = orderOutcomeBody({ to, failReason, reason });
    if (!body) {
      onInvalid();
      return;
    }
    onOutcome(order.publicId, body);
  }

  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="bodySmall">{`${order.publicId} · ${order.status}`}</AppText>
      <ContactLines title="Покупатель" contacts={order.buyerContacts} />
      <ContactLines title="Автор" contacts={order.sellerContacts} />
      <SecondaryButton
        label="Исход: состоялась"
        disabled={busy || !reasonReady}
        onPress={() => outcome('COMPLETED')}
      />
      <SecondaryButton
        label="Исход: не состоялась"
        disabled={busy || !reasonReady || failReason === ''}
        onPress={() => outcome('FAILED')}
      />
      <SecondaryButton
        label="Снять страйк"
        disabled={busy || !reasonReady}
        onPress={() => {
          const note = requiredReason(reason);
          if (!note) return;
          onVoid(order.publicId, note);
        }}
      />
      <SecondaryButton
        label="Заблокировать покупателя по адресу сделки"
        disabled={busy || !reasonReady || !order.buyerContacts}
        onPress={() => {
          if (order.buyerContacts) onBanBuyer(order.buyerContacts.email);
        }}
      />
      <SecondaryButton
        label="Заблокировать автора по адресу сделки"
        disabled={busy || !reasonReady || !order.sellerContacts}
        onPress={() => {
          if (order.sellerContacts) onBanSeller(order.sellerContacts.email);
        }}
      />
      {lotKnown && lotId ? (
        <SecondaryButton
          label="Снять лот"
          disabled={busy || removeListingBody(reason) === null}
          onPress={() => {
            const body = removeListingBody(reason);
            if (body) onRemove(lotId, body);
          }}
        />
      ) : null}
      {lotKnown && !lotId ? (
        <AppText role="bodySmall">Лот не найден, снятие не отправлено.</AppText>
      ) : null}
    </View>
  );
}
