import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../../components/ui/AppDialog';
import { AppText } from '../../components/ui/AppText';
import { TextButton } from '../../components/ui/Button';
import { formatMoney } from '../../lib/money';
import { commerceKeys } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';

const bidStamp = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Minsk',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function BidHistorySheet({
  open,
  listingId,
  currency,
  onClose,
}: {
  open: boolean;
  listingId: string | null;
  currency: 'BYN' | 'RUB';
  onClose: () => void;
}) {
  const api = useApiClient();
  const history = useQuery({
    queryKey: commerceKeys.bids(listingId ?? 'none'),
    enabled: open && listingId != null,
    queryFn: ({ signal }) => api.commerce.listBids(listingId ?? '', { signal }),
  });
  return (
    <AppDialog
      presentation="sheet"
      open={open}
      title="История ставок"
      onClose={onClose}
    >
      {open && history.isPending ? (
        <AppText role="caption">Загружаем ставки</AppText>
      ) : null}
      {open && history.isError ? (
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="bodySmall">Не удалось загрузить историю ставок.</AppText>
          <TextButton label="Повторить" onPress={() => void history.refetch()} />
        </View>
      ) : null}
      {open && history.data && history.data.bids.length === 0 ? (
        <AppText role="bodySmall">Ставок ещё нет</AppText>
      ) : null}
      {open && history.data && history.data.bids.length > 0 ? (
        <View style={{ gap: designTokens.space.x3 }}>
          {history.data.bids.map((bid, index) => (
            <View key={`${index}-${bid.createdAt}`}>
              <AppText role="body">{bid.participantLabel}</AppText>
              <AppText role="caption">
                {`${formatMoney(bid.amountMinor, currency)} · ${bidStamp.format(new Date(bid.createdAt))}`}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </AppDialog>
  );
}
