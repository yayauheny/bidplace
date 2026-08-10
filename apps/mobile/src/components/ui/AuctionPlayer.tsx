import type { ReactNode } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

type AuctionPlayerProps = {
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

export function AuctionPlayer({
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
}: AuctionPlayerProps) {
  const backdropStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        } as unknown as ViewStyle)
      : undefined;

  return (
    <View
      accessibilityLabel={`Торги. ${statusLabel}. ${currentPriceLabel}. ${deadlineLabel}`}
      style={[
        {
          gap: designTokens.space.x5,
          borderRadius: designTokens.radius.panel,
          backgroundColor: designTokens.color.glass,
          padding: designTokens.space.x5,
          ...designTokens.elevation.floating,
        },
        backdropStyle,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: designTokens.space.x3,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: designTokens.space.x2,
            borderRadius: designTokens.radius.pill,
            backgroundColor: designTokens.color.surface,
            paddingHorizontal: designTokens.space.x3,
            paddingVertical: designTokens.space.x2,
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: designTokens.radius.pill,
              backgroundColor:
                statusTone === 'success'
                  ? designTokens.color.success
                  : statusTone === 'danger'
                    ? designTokens.color.danger
                    : statusTone === 'accent'
                      ? designTokens.color.accent
                      : designTokens.color.textMuted,
            }}
          />
          <AppText role="metadata" tone={statusTone}>
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
        <AppText role="screenTitle">{currentPriceLabel}</AppText>
        <AppText role="bodySmall" tone="secondary">
          Старт: {startPriceLabel}
          {minimumNextBidLabel ? ` · Мин. ставка: ${minimumNextBidLabel}` : ''}
        </AppText>
      </View>

      <View
        style={{
          gap: designTokens.space.x1,
          borderTopWidth: 1,
          borderTopColor: designTokens.color.border,
          paddingTop: designTokens.space.x4,
        }}
      >
        <AppText accessibilityLiveRegion="polite" role="label">
          {timingLabel}
        </AppText>
        <AppText role="caption" tone="secondary">
          {deadlineLabel}
        </AppText>
      </View>
      {children ? (
        <View
          style={{
            gap: designTokens.space.x3,
            borderTopWidth: 1,
            borderTopColor: designTokens.color.border,
            paddingTop: designTokens.space.x4,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}
