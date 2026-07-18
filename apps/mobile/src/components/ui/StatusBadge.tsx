import type { LightTheme } from '@bidplace/design-tokens';
import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { Text, XStack } from 'tamagui';

// Status badge tones — status must NEVER rely on color alone.
// Each tone produces a distinct background + text + border combination.
type StatusTone = 'neutral' | 'primary' | 'positive' | 'warning' | 'negative';

type StatusBadgeProps = {
  tone?: StatusTone;
  children: string;
  /** accessibilityLabel overrides the badge text for screen readers */
  accessibilityLabel?: string;
};

const toneStyles: Record<
  StatusTone,
  (p: LightTheme) => { backgroundColor: string; borderColor: string; color: string }
> = {
  neutral: (p) => ({
    backgroundColor: p.surfaceMuted,
    borderColor: p.borderColor,
    color: p.colorSecondary,
  }),
  primary: (p) => ({
    backgroundColor: p.primaryTint,
    borderColor: p.primary,
    color: p.primary,
  }),
  positive: (p) => ({
    backgroundColor: p.positiveTint,
    borderColor: p.positive,
    color: p.positive,
  }),
  warning: (p) => ({
    backgroundColor: p.warningTint,
    borderColor: p.warning,
    color: p.warning,
  }),
  negative: (p) => ({
    backgroundColor: p.negativeTint,
    borderColor: p.negative,
    color: p.negative,
  }),
};

export function StatusBadge({
  tone = 'neutral',
  children,
  accessibilityLabel,
}: StatusBadgeProps) {
  const palette = useAppThemePalette();
  const styles = toneStyles[tone](palette);

  return (
    <XStack
      accessibilityLabel={accessibilityLabel ?? children}
      style={{
        alignSelf: 'flex-start',
        alignItems: 'center',
        borderRadius: mobileRadius.small,
        borderWidth: 1,
        paddingHorizontal: mobileSpacing[2],
        paddingVertical: 4,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
      }}
    >
      <Text
        style={{
          color: styles.color,
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '600',
          letterSpacing: 0.3,
        }}
      >
        {children}
      </Text>
    </XStack>
  );
}
