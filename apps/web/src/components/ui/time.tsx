'use client';

import { useEffect, useMemo, useState } from 'react';

import { formatDateTime, formatRelativeTime } from '../../lib/formatters';
import { radius, spacing } from '../../theme/tokens';
import { Badge } from './surfaces';
import { Text } from './layout';
import { YStack, XStack } from './stack';

type CountdownTextProps = {
  value: string | Date;
  prefix?: string;
  suffix?: string;
};

export function CountdownText({
  value,
  prefix,
  suffix,
}: CountdownTextProps) {
  const target = useMemo(
    () => (typeof value === 'string' ? new Date(value) : value),
    [value],
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const remaining = Math.max(0, target.getTime() - now);
  const label = formatRelativeTime(target);

  return (
    <Text size="small" weight="strong">
      {prefix ? `${prefix} ` : ''}
      {remaining > 0 ? label : '0 с'}
      {suffix ? ` ${suffix}` : ''}
    </Text>
  );
}

type TimeframeFrameProps = {
  startsAt: string | Date;
  endsAt: string | Date;
  status:
    | 'draft'
    | 'scheduled'
    | 'active'
    | 'ended'
    | 'sold'
    | 'cancelled'
    | 'failed'
    | 'hidden';
};

export function TimeframeFrame({
  startsAt,
  endsAt,
  status,
}: TimeframeFrameProps) {
  const statusLabel =
    status === 'scheduled'
      ? 'Старт скоро'
      : status === 'active'
        ? 'Аукцион идет'
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
      gap={spacing[2]}
      padding={spacing[3]}
      borderRadius={radius.md}
      borderWidth={1}
      borderColor="var(--borderColor)"
      backgroundColor="var(--backgroundMuted)"
    >
      <XStack alignItems="center" justifyContent="space-between" gap={spacing[2]}>
        <Badge>
          <Text size="caption" weight="strong" tone="muted">
            {statusLabel}
          </Text>
        </Badge>
        <CountdownText
          value={status === 'scheduled' ? startsAt : endsAt}
          prefix={status === 'scheduled' ? 'Старт через' : 'Осталось'}
        />
      </XStack>
      <Text size="caption" tone="muted">
        Старт {formatDateTime(startsAt)}
      </Text>
      <Text size="caption" tone="muted">
        Финиш {formatDateTime(endsAt)}
      </Text>
    </YStack>
  );
}
