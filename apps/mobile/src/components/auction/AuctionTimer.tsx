import { useEffect, useMemo, useState } from 'react';

import { formatRelativeTime } from '../../lib/formatters';
import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { Text, XStack, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';

type AuctionStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'sold' | 'cancelled' | 'failed' | 'hidden';

type AuctionTimerProps = {
  startsAt: string | Date;
  endsAt: string | Date;
  status: AuctionStatus;
};

export function AuctionTimer({ startsAt, endsAt, status }: AuctionTimerProps) {
  const palette = useAppThemePalette();
  const target = useMemo(
    () => (status === 'scheduled' ? new Date(startsAt) : new Date(endsAt)),
    [endsAt, startsAt, status],
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(0, target.getTime() - now);
  const label = formatRelativeTime(target);
  const bannerText =
    status === 'scheduled'
      ? 'До старта'
      : status === 'active'
        ? 'До конца'
        : status === 'sold'
          ? 'Продан'
          : status === 'failed'
            ? 'Не состоялся'
            : status === 'ended'
              ? 'Завершен'
              : status === 'cancelled'
                ? 'Отменен'
                : 'Черновик';

  return (
    <YStack
      style={{
        gap: mobileSpacing[2],
        padding: mobileSpacing[3],
        borderRadius: mobileRadius.md,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surfaceMuted,
      }}
    >
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: mobileSpacing[2] }}>
        <YStack
          style={{
            borderRadius: 999,
            paddingHorizontal: mobileSpacing[2],
            paddingVertical: mobileSpacing[1],
            backgroundColor: palette.background,
            borderWidth: 1,
            borderColor: palette.border,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: palette.textMuted }}>{bannerText}</Text>
        </YStack>
        <Text style={{ fontSize: 15, fontWeight: '700', color: palette.text }}>
          {remaining > 0 ? label : '0 с'}
        </Text>
      </XStack>
    </YStack>
  );
}
