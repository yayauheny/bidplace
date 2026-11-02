import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import type { PublicLot } from '@bidplace/contracts';

import { StatusBadge } from '../../components/ui/StatusBadge';
import { AppText } from '../../components/ui/AppText';
import { PrimaryButton, TextButton } from '../../components/ui/Button';
import { useNow } from '../../lib/use-now';
import { presentLot, syncedNowMs, type LotAction } from './lot-view';
import type { LotRead } from './use-lot';

export const DEAL_STEPS = [
  'Работа бронируется.',
  'Вы связываетесь с автором.',
  'Автор подтверждает сделку.',
] as const;

export function LotPanel({
  read,
  onAction,
  onHistory,
  listOffer,
  onList,
}: {
  read: LotRead;
  onAction?: (action: LotAction) => void;
  onHistory?: () => void;
  listOffer?: { enabled: boolean; reason: string | null } | null;
  onList?: () => void;
}) {
  const clock =
    read.lot?.type === 'AUCTION' && read.lot.effectiveStatus === 'LIVE';
  const deviceNow = useNow(1000, clock && read.active);
  if (read.status === 'auth-loading' || read.status === 'loading') {
    return <AppText role="caption">Проверяем, есть ли продажа</AppText>;
  }
  if (read.status === 'error') {
    return (
      <View style={{ gap: designTokens.space.x2 }}>
        <AppText role="bodySmall">Не удалось загрузить продажу.</AppText>
        <TextButton label="Повторить" onPress={() => void read.refetch()} />
      </View>
    );
  }
  const view = read.lot
    ? presentLot({
        lot: read.lot,
        syncedNowMs: syncedNowMs({
          serverNow: read.lot.serverNow,
          dataUpdatedAt: read.dataUpdatedAt,
          deviceNow,
        }),
        extensionUntil: read.extensionUntil,
        nowMs: deviceNow,
      })
    : null;
  if (!view || view.phase === 'portfolio') {
    const stale = read.status === 'empty-stale' || read.status === 'stale';
    if (!stale && !listOffer) return null;
    return (
      <View style={{ gap: designTokens.space.x2, paddingTop: designTokens.space.x4 }}>
        {stale ? <StaleSale onRetry={() => void read.refetch()} /> : null}
        {listOffer ? (
          <ListOffer offer={listOffer} onList={onList} />
        ) : null}
      </View>
    );
  }
  const reason =
    view.action?.kind === 'cancel-lot' ? view.authorHint : view.action?.reason;
  return (
    <View
      testID="lot-panel"
      style={{ gap: designTokens.space.x2, paddingTop: designTokens.space.x4 }}
    >
      {read.status === 'stale' ? (
        <StaleSale onRetry={() => void read.refetch()} />
      ) : null}
      {view.statusLabel && view.statusTone ? (
        <StatusBadge tone={view.statusTone} label={view.statusLabel} />
      ) : null}
      {view.priceCaption && view.priceLabel ? (
        <View>
          <AppText role="caption">{view.priceCaption}</AppText>
          <AppText role="workTitle">{view.priceLabel}</AppText>
        </View>
      ) : null}
      {view.bidLabel ? <AppText role="caption">{view.bidLabel}</AppText> : null}
      {view.scheduleLabel ? (
        <AppText role="bodySmall">{view.scheduleLabel}</AppText>
      ) : null}
      {view.timerLabel ? (
        <AppText role="bodySmall">{view.timerLabel}</AppText>
      ) : null}
      {view.extensionLabel ? (
        <AppText role="caption">{view.extensionLabel}</AppText>
      ) : null}
      {reason ? <AppText role="bodySmall">{reason}</AppText> : null}
      {view.action?.kind === 'cancel-lot' && view.action.enabled ? (
        <PrimaryButton
          label="Снять с продажи"
          width="full"
          disabled={!onAction}
          onPress={() => {
            if (view.action) onAction?.(view.action);
          }}
        />
      ) : null}
      {view.action && read.lot && onAction && view.action.kind !== 'cancel-lot' ? (
        <BuyerAction action={view.action} lot={read.lot} onAction={onAction} />
      ) : null}
      {view.showsBidHistory && onHistory ? (
        <TextButton label="История ставок" onPress={onHistory} />
      ) : null}
    </View>
  );
}

function BuyerAction({
  action,
  lot,
  onAction,
}: {
  action: LotAction;
  lot: PublicLot;
  onAction: (action: LotAction) => void;
}) {
  const label = buyerLabel(action, lot.type);
  if (!label) return null;
  return (
    <PrimaryButton
      label={label}
      width="full"
      disabled={!action.enabled}
      onPress={() => {
        if (action.enabled) onAction(action);
      }}
    />
  );
}

function buyerLabel(action: LotAction, type: PublicLot['type']): string | null {
  if (action.kind === 'contacts' || action.kind === 'cancel-lot') return null;
  if (action.kind === 'buy') return 'Купить';
  if (action.kind === 'bid') return 'Сделать ставку';
  return type === 'FIXED' ? 'Купить' : 'Сделать ставку';
}

function ListOffer({
  offer,
  onList,
}: {
  offer: { enabled: boolean; reason: string | null };
  onList?: () => void;
}) {
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      {offer.reason ? <AppText role="bodySmall">{offer.reason}</AppText> : null}
      <PrimaryButton
        label="Выставить на продажу"
        width="full"
        disabled={!offer.enabled || !onList}
        onPress={() => {
          if (offer.enabled) onList?.();
        }}
      />
    </View>
  );
}

function StaleSale({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="caption">Данные продажи устарели.</AppText>
      <TextButton label="Повторить" onPress={onRetry} />
    </View>
  );
}
