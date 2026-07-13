import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { type AppThemePalette, useAppThemePalette } from '../../theme/palette';
import { Text, XStack } from 'tamagui';

type StatusTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

type StatusBadgeProps = {
  tone?: StatusTone;
  children: string;
};

const toneStyles: Record<
  StatusTone,
  (palette: AppThemePalette) => { backgroundColor: string; borderColor: string; color: string }
> = {
  neutral: (palette) => ({
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    color: palette.textMuted,
  }),
  accent: (palette) => ({
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
    color: palette.primary,
  }),
  success: (palette) => ({
    backgroundColor: palette.successSoft,
    borderColor: palette.success,
    color: palette.success,
  }),
  warning: (palette) => ({
    backgroundColor: palette.warningSoft,
    borderColor: palette.warning,
    color: palette.warning,
  }),
  danger: (palette) => ({
    backgroundColor: palette.dangerSoft,
    borderColor: palette.danger,
    color: palette.danger,
  }),
};

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  const palette = useAppThemePalette();
  const styles = toneStyles[tone](palette);

  return (
    <XStack
      style={{
        alignItems: 'center',
        borderRadius: mobileRadius.full,
        borderWidth: 1,
        paddingHorizontal: mobileSpacing[2],
        paddingVertical: mobileSpacing[1],
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
        }}
      >
        {children}
      </Text>
    </XStack>
  );
}
