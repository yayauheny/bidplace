import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { Text, XStack } from 'tamagui';

type StatusTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

type StatusBadgeProps = {
  tone?: StatusTone;
  children: string;
};

const toneStyles: Record<
  StatusTone,
  { backgroundColor: string; borderColor: string; color: string }
> = {
  neutral: {
    backgroundColor: '$surfaceMuted',
    borderColor: '$border',
    color: '$textMuted',
  },
  accent: {
    backgroundColor: '$primarySoft',
    borderColor: '$primary',
    color: '$primary',
  },
  success: {
    backgroundColor: '$successSoft',
    borderColor: '$success',
    color: '$success',
  },
  warning: {
    backgroundColor: '$warningSoft',
    borderColor: '$warning',
    color: '$warning',
  },
  danger: {
    backgroundColor: '$dangerSoft',
    borderColor: '$danger',
    color: '$danger',
  },
};

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  const palette = useAppThemePalette();
  const styles = toneStyles[tone];
  const backgroundColor =
    styles.backgroundColor === '$surfaceMuted'
      ? palette.surfaceMuted
      : styles.backgroundColor === '$primarySoft'
        ? palette.primarySoft
        : styles.backgroundColor === '$successSoft'
          ? palette.successSoft
          : styles.backgroundColor === '$warningSoft'
            ? palette.warningSoft
            : palette.dangerSoft;
  const borderColor =
    styles.borderColor === '$border'
      ? palette.border
      : styles.borderColor === '$primary'
        ? palette.primary
        : styles.borderColor === '$success'
          ? palette.success
          : styles.borderColor === '$warning'
            ? palette.warning
            : palette.danger;
  const color =
    styles.color === '$textMuted'
      ? palette.textMuted
      : styles.color === '$primary'
        ? palette.primary
        : styles.color === '$success'
          ? palette.success
          : styles.color === '$warning'
            ? palette.warning
            : palette.danger;

  return (
    <XStack
      style={{
        alignItems: 'center',
        borderRadius: mobileRadius.full,
        borderWidth: 1,
        paddingHorizontal: mobileSpacing[2],
        paddingVertical: mobileSpacing[1],
        backgroundColor,
        borderColor,
      }}
    >
      <Text
        style={{
          color,
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
