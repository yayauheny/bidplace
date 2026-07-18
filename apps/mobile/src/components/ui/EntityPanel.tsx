import type { ReactNode } from 'react';
import { Text, YStack } from 'tamagui';

import { mobileRadius, mobileSpacing } from '../../theme/tokens';

type EntityPanelProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function EntityPanel({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: EntityPanelProps) {
  return (
    <YStack
      style={{
        gap: mobileSpacing[3],
        padding: mobileSpacing[3],
        borderWidth: 1,
        borderColor: '#DFDDD7',
        borderRadius: mobileRadius.md,
        backgroundColor: '#FFFFFF',
      }}
    >
      <YStack style={{ gap: mobileSpacing[1] }}>
        {eyebrow ? (
          <Text color="$textMuted" style={{ fontSize: 12, lineHeight: 16, letterSpacing: 0.9, textTransform: 'uppercase' }}>
            {eyebrow}
          </Text>
        ) : null}
        <Text color="$text" style={{ fontSize: 18, lineHeight: 24, fontWeight: '600' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text color="$textMuted" style={{ fontSize: 14, lineHeight: 20 }}>
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {children}
      {footer}
    </YStack>
  );
}
