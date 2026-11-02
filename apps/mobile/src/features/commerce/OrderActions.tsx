import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import type { OrderDetail } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../../components/ui/AppDialog';
import { AppText } from '../../components/ui/AppText';
import { PrimaryButton, SecondaryButton, TextButton } from '../../components/ui/Button';
import { getSupportEmail, getSupportTelegramUrl } from '../../lib/environment';
import { formatMoney } from '../../lib/money';
import { commerceActionError } from './use-lot-actions';
import {
  FAIL_REASON_LABEL,
  orderActions,
  type SellerFailReason,
} from './order-view';
import { ReportSheet } from './ReportSheet';
import type { useOrderCommands } from './use-order-actions';

const STRIKE_WARNING =
  'Вы получите страйк. После 2 страйков ставки и покупки блокируются';

export function OrderActions({
  order,
  commands,
}: {
  order: OrderDetail;
  commands: ReturnType<typeof useOrderCommands>;
}) {
  const router = useRouter();
  const model = orderActions(order, Date.now());
  const [confirm, setConfirm] = useState<
    | null
    | { kind: 'refuse' }
    | { kind: 'decline' }
    | { kind: 'complete' }
    | { kind: 'offer-next' }
    | { kind: 'fail'; reason: SellerFailReason }
  >(null);
  const [reportOpen, setReportOpen] = useState(false);
  const pending =
    commands.accept.pending ||
    commands.decline.pending ||
    commands.complete.pending ||
    commands.fail.pending ||
    commands.offerNext.pending;
  const error =
    commands.accept.error ??
    commands.decline.error ??
    commands.complete.error ??
    commands.fail.error ??
    commands.offerNext.error;
  const telegram = getSupportTelegramUrl();
  const email = getSupportEmail();
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      {model.paymentWarning ? (
        <AppText role="bodySmall">
          bidplace не принимает оплату. Не переводите деньги, пока не договорились с автором.
        </AppText>
      ) : null}
      {model.resaleNote ? (
        <AppText role="bodySmall">Работа снова в продаже</AppText>
      ) : null}
      {model.accept ? (
        <PrimaryButton
          label={`Принять за ${formatMoney(order.amountMinor, order.currency)}`}
          width="full"
          loading={commands.accept.pending}
          disabled={pending}
          onPress={() => void run(commands.accept.submit(undefined), order.publicId)}
        />
      ) : null}
      {model.declineOffer ? (
        <SecondaryButton
          label="Отказаться"
          width="full"
          disabled={pending}
          onPress={() => setConfirm({ kind: 'decline' })}
        />
      ) : null}
      {model.buyerRefuse ? (
        <SecondaryButton
          label="Отказаться от покупки"
          width="full"
          disabled={pending}
          onPress={() => setConfirm({ kind: 'refuse' })}
        />
      ) : null}
      {model.complete ? (
        <PrimaryButton
          label="Сделка состоялась"
          width="full"
          disabled={pending}
          onPress={() => setConfirm({ kind: 'complete' })}
        />
      ) : null}
      {model.failReasons.length > 0 ? (
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="caption">Не состоялась</AppText>
          {model.failReasons.map((item) => (
            <View key={item.reason} style={{ gap: designTokens.space.x1 }}>
              <SecondaryButton
                label={FAIL_REASON_LABEL[item.reason]}
                width="full"
                disabled={!item.enabled || pending}
                onPress={() => setConfirm({ kind: 'fail', reason: item.reason })}
              />
              {item.hint ? <AppText role="caption">{item.hint}</AppText> : null}
            </View>
          ))}
        </View>
      ) : null}
      {model.offerNext ? (
        <PrimaryButton
          label="Предложить следующему"
          width="full"
          disabled={pending}
          onPress={() => setConfirm({ kind: 'offer-next' })}
        />
      ) : null}
      {model.relist ? (
        <SecondaryButton
          label="Выставить снова"
          width="full"
          onPress={() =>
            router.push(`/product/${order.workPublicId}?sell=1` as Href)
          }
        />
      ) : null}
      {model.report ? (
        <TextButton label="Пожаловаться" onPress={() => setReportOpen(true)} />
      ) : null}
      {telegram ? (
        <TextButton label="Поддержка в Telegram" onPress={() => void Linking.openURL(telegram)} />
      ) : null}
      {email ? (
        <TextButton
          label="Поддержка по почте"
          onPress={() => void Linking.openURL(`mailto:${email}`)}
        />
      ) : null}
      {error ? (
        <AppText role="bodySmall" tone="danger">
          {commerceActionError(error, 'Не удалось выполнить действие.')}
        </AppText>
      ) : null}
      <Confirm
        confirm={confirm}
        pending={pending}
        buyerFault={confirm?.kind === 'fail' && confirm.reason !== 'SELLER_REFUSED'}
        onClose={() => setConfirm(null)}
        onConfirm={() => void apply()}
      />
      <ReportSheet
        open={reportOpen}
        report={commands.report}
        onClose={() => setReportOpen(false)}
      />
    </View>
  );

  async function apply() {
    if (!confirm || pending) return;
    if (confirm.kind === 'refuse') {
      await run(
        commands.fail.submit({ reason: 'BUYER_REFUSED', confirm: true }),
        order.publicId,
      );
    } else if (confirm.kind === 'decline') {
      await run(commands.decline.submit(undefined), order.publicId);
    } else if (confirm.kind === 'complete') {
      await run(commands.complete.submit(undefined), order.publicId);
    } else if (confirm.kind === 'offer-next') {
      await run(commands.offerNext.submit(undefined), order.publicId);
    } else if (confirm.kind === 'fail') {
      await run(commands.fail.submit({ reason: confirm.reason }), order.publicId);
    }
    setConfirm(null);
  }

  async function run(
    pendingResult: Promise<{ status: string; value?: { publicId?: string } | null }>,
    currentId: string,
  ) {
    const result = await pendingResult;
    if (result.status !== 'accepted' || !result.value || !('publicId' in result.value)) return;
    if (result.value.publicId && result.value.publicId !== currentId) {
      router.replace(`/account/orders/${result.value.publicId}` as Href);
    }
  }
}

function Confirm({
  confirm,
  pending,
  buyerFault,
  onClose,
  onConfirm,
}: {
  confirm: { kind: string } | null;
  pending: boolean;
  buyerFault: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const title =
    confirm?.kind === 'refuse'
      ? 'Отказаться от покупки'
      : confirm?.kind === 'complete'
        ? 'Сделка состоялась'
        : confirm?.kind === 'offer-next'
          ? 'Предложить следующему'
          : 'Подтвердите действие';
  const body =
    confirm?.kind === 'refuse'
      ? STRIKE_WARNING
      : buyerFault
        ? 'Это отметка в истории покупателя.'
        : 'Это действие записывается в заказ.';
  return (
    <AppDialog open={confirm !== null} title={title} onClose={onClose}>
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="bodySmall">{body}</AppText>
        <PrimaryButton
          label="Подтвердить"
          width="full"
          loading={pending}
          disabled={pending}
          onPress={onConfirm}
        />
        <SecondaryButton label="Отмена" width="full" onPress={onClose} />
      </View>
    </AppDialog>
  );
}
