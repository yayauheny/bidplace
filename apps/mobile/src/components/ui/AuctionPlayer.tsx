import { Platform, View, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';
import { MotionPressable } from './MotionPressable';

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
  actionLabel?: string;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onAction?: () => void;
  width?: number;
};

function splitTimingLabel(value: string): [string, string] {
  const separator = value.indexOf(':');
  if (separator === -1) return ['Статус', value];
  return [value.slice(0, separator), value.slice(separator + 1).trim()];
}

export function AuctionPlayer({
  statusLabel,
  participationLabel,
  currentPriceLabel,
  startPriceLabel,
  minimumNextBidLabel,
  timingLabel,
  deadlineLabel,
  actionLabel,
  actionDisabled,
  actionLoading,
  onAction,
  width,
}: AuctionPlayerProps) {
  const backdropStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        } as unknown as ViewStyle)
      : undefined;
  const [timingTitle, timingValue] = splitTimingLabel(timingLabel);

  return (
    <View
      accessibilityLabel={`Торги. ${statusLabel}. ${currentPriceLabel}. ${deadlineLabel}${participationLabel ? `. ${participationLabel}` : ''}`}
      style={[
        {
          width: width ?? '100%',
          alignSelf: width ? 'center' : undefined,
          minHeight: 68,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 18,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: designTokens.color.border,
          backgroundColor: '#FFFEFB',
          paddingVertical: 8,
          paddingHorizontal: 12,
          ...designTokens.elevation.floating,
        },
        backdropStyle,
      ]}
    >
      <View style={{ width: 84, gap: 2 }}>
        <AppText
          role="caption"
          tone="muted"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 11 }}
        >
          Ставка
        </AppText>
        <AppText
          role="numeric"
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 19,
            lineHeight: 20,
          }}
        >
          {currentPriceLabel}
        </AppText>
      </View>
      <View style={{ width: 112, gap: 2, minWidth: 0 }}>
        <AppText
          role="caption"
          tone="muted"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 11 }}
        >
          {timingTitle}
        </AppText>
        <AppText
          role="numeric"
          accessibilityLiveRegion="polite"
          numberOfLines={1}
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 19,
            lineHeight: 20,
          }}
        >
          {timingValue}
        </AppText>
      </View>
      {actionLabel && onAction ? (
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityState={{ busy: actionLoading, disabled: actionDisabled }}
          disabled={actionDisabled || actionLoading}
          onPress={onAction}
          preset="primaryAction"
          style={{
            width: 124,
            height: 44,
            minHeight: 44,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 14,
            backgroundColor: designTokens.color.action,
          }}
          interactionStyle={({ hovered, pressed }) => ({
            backgroundColor:
              hovered || pressed
                ? designTokens.color.actionHover
                : designTokens.color.action,
          })}
        >
          <AppText
            role="button"
            style={{
              color: designTokens.color.surface,
              fontFamily: 'Inter_600SemiBold',
            }}
          >
            {actionLoading ? 'Отправка…' : actionLabel}
          </AppText>
        </MotionPressable>
      ) : null}
      <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
        <AppText>
          {startPriceLabel}
          {minimumNextBidLabel ? ` ${minimumNextBidLabel}` : ''}
        </AppText>
      </View>
    </View>
  );
}
