// OperationalPanel — panel for operational/transactional UI sections.
// Use for: bid panel, order summary, admin controls.
// Responsibility: slightly elevated surface with a clear heading slot.
// Not for product cards or generic content containers.
import type { ReactNode } from 'react';
import { Text, YStack } from 'tamagui';

import { mobileRadius, mobileSpacing, fontFamilies } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';

type OperationalPanelProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function OperationalPanel({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: OperationalPanelProps) {
  const palette = useAppThemePalette();

  return (
    <YStack
      style={{
        gap: mobileSpacing[4],
        padding: mobileSpacing[4],
        borderWidth: 1,
        borderColor: palette.borderColor,
        borderRadius: mobileRadius.panel,
        backgroundColor: palette.surface,
      }}
    >
      {(eyebrow ?? title ?? subtitle) ? (
        <YStack style={{ gap: mobileSpacing[1] }}>
          {eyebrow ? (
            <Text
              style={{
                color: palette.colorMuted,
                fontFamily: fontFamilies.sansMedium,
                fontSize: 11,
                lineHeight: 14,
                letterSpacing: 1.0,
                textTransform: 'uppercase',
              }}
            >
              {eyebrow}
            </Text>
          ) : null}
          {title ? (
            <Text
              style={{
                color: palette.color,
                fontFamily: fontFamilies.sansStrong,
                fontSize: 17,
                lineHeight: 22,
                fontWeight: '600',
              }}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text
              style={{
                color: palette.colorMuted,
                fontFamily: fontFamilies.sansRegular,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </YStack>
      ) : null}
      {children}
      {footer}
    </YStack>
  );
}

// EntityPanel alias for existing imports during migration
export { OperationalPanel as EntityPanel };
