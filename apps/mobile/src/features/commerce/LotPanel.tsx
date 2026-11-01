import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { StatusBadge } from '../../components/ui/StatusBadge';
import { AppText } from '../../components/ui/AppText';
import { TextButton } from '../../components/ui/Button';
import { useNow } from '../../lib/use-now';
import { presentLot, syncedNowMs } from './lot-view';
import type { LotRead } from './use-lot';

export const DEAL_STEPS = [
  'Работа бронируется.',
  'Вы связываетесь с автором.',
  'Автор подтверждает сделку.',
] as const;

export function LotPanel({ read }: { read: LotRead }) {
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
    return read.status === 'empty-stale' || read.status === 'stale' ? (
      <StaleSale onRetry={() => void read.refetch()} />
    ) : null;
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
