import type { ReactNode } from 'react';
import { View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';
import { Separator } from './Separator';

type AuctionPanelProps = {
  statusLabel: string;
  statusTone: 'accent' | 'success' | 'secondary' | 'danger';
  participationLabel?: string;
  participationTone?: 'accent' | 'success' | 'secondary' | 'danger';
  currentPriceLabel: string;
  startPriceLabel: string;
  minimumNextBidLabel?: string;
  timingLabel: string;
  deadlineLabel: string;
  realtimeLabel: string;
  children?: ReactNode;
};

export function AuctionPanel({
  statusLabel,
  statusTone,
  participationLabel,
  participationTone = 'secondary',
  currentPriceLabel,
  startPriceLabel,
  minimumNextBidLabel,
  timingLabel,
  deadlineLabel,
  realtimeLabel,
  children,
}: AuctionPanelProps) {
  return (
    <View
      accessibilityLabel={`Торги. ${statusLabel}. ${currentPriceLabel}. ${deadlineLabel}`}
      style={{
        gap: modernTokens.space.x4,
        borderRadius: modernTokens.radius.panel,
        borderWidth: 1,
        borderColor: modernTokens.color.border,
        backgroundColor: modernTokens.color.surface,
        padding: modernTokens.space.x5,
      }}
    >
      <View style={{ gap: modernTokens.space.x2 }}>
        <AppText role="metadata" tone="secondary">
          Торги
        </AppText>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: modernTokens.space.x2,
          }}
        >
          <AppText
            role="caption"
            tone={statusTone}
            style={{
              backgroundColor: modernTokens.color.chip,
              borderRadius: modernTokens.radius.pill,
              overflow: 'hidden',
              paddingHorizontal: modernTokens.space.x2,
              paddingVertical: modernTokens.space.x1,
            }}
          >
            {statusLabel}
          </AppText>
          {participationLabel ? (
            <AppText
              role="caption"
              tone={participationTone}
              style={{
                backgroundColor: modernTokens.color.chip,
                borderRadius: modernTokens.radius.pill,
                overflow: 'hidden',
                paddingHorizontal: modernTokens.space.x2,
                paddingVertical: modernTokens.space.x1,
              }}
            >
              {participationLabel}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={{ gap: modernTokens.space.x1 }}>
        <AppText role="metadata" tone="secondary">
          Текущая цена
        </AppText>
        <AppText role="display">{currentPriceLabel}</AppText>
        <AppText role="bodySmall" tone="secondary">
          Старт: {startPriceLabel}
          {minimumNextBidLabel ? ` · Мин. ставка: ${minimumNextBidLabel}` : ''}
        </AppText>
      </View>

      <Separator />
      <View style={{ gap: modernTokens.space.x1 }}>
        <AppText accessibilityLiveRegion="polite" role="bodySmall">
          {timingLabel}
        </AppText>
        <AppText role="bodySmall" tone="secondary">
          {deadlineLabel}
        </AppText>
        <AppText role="caption" tone="muted">
          {realtimeLabel}
        </AppText>
      </View>
      {children ? (
        <>
          <Separator />
          <View style={{ gap: modernTokens.space.x3 }}>{children}</View>
        </>
      ) : null}
    </View>
  );
}
