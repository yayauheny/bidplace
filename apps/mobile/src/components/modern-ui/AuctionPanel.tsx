import type { ReactNode } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

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
  children,
}: AuctionPanelProps) {
  return (
    <View
      accessibilityLabel={`Торги. ${statusLabel}. ${currentPriceLabel}. ${deadlineLabel}`}
      style={{
        gap: designTokens.space.x4,
        borderRadius: designTokens.radius.panel,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        backgroundColor: designTokens.color.surface,
        padding: designTokens.space.x5,
      }}
    >
      <View style={{ gap: designTokens.space.x2 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: designTokens.space.x3,
          }}
        >
          <AppText role="metadata" tone="secondary">
            Статус
          </AppText>
          <AppText
            role="bodySmall"
            tone={statusTone}
            style={{
              flexShrink: 1,
              textAlign: 'right',
            }}
          >
            <AppText tone={statusTone}>● </AppText>
            {statusLabel}
          </AppText>
        </View>
        {participationLabel ? (
          <AppText role="caption" tone={participationTone}>
            {participationLabel}
          </AppText>
        ) : null}
      </View>

      <View style={{ gap: designTokens.space.x1 }}>
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
      <View style={{ gap: designTokens.space.x1 }}>
        <AppText accessibilityLiveRegion="polite" role="bodySmall">
          {timingLabel}
        </AppText>
        <AppText role="bodySmall" tone="secondary">
          {deadlineLabel}
        </AppText>
      </View>
      {children ? (
        <>
          <Separator />
          <View style={{ gap: designTokens.space.x3 }}>{children}</View>
        </>
      ) : null}
    </View>
  );
}
