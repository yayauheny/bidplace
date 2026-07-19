import type { ReactNode } from 'react';
import { Text, YStack } from 'tamagui';

import { mobileSpacing, palette } from '../../theme/tokens';
import { StatusBadge } from './StatusBadge';

type PageIntroProps = {
  badge?: {
    label: string;
    tone?: 'positive' | 'warning' | 'negative' | 'neutral';
  };
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PageIntro({
  badge,
  title,
  description,
  children,
}: PageIntroProps) {
  return (
    <YStack style={{ gap: mobileSpacing[3] }}>
      {badge ? <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge> : null}
      <YStack style={{ gap: mobileSpacing[2] }}>
        <Text fontFamily="$heading" style={{ color: palette.textPrimary, fontSize: 36, lineHeight: 40 }}>
          {title}
        </Text>
        {description ? (
          <Text style={{ color: palette.textMuted, fontSize: 16, lineHeight: 24, maxWidth: 720 }}>
            {description}
          </Text>
        ) : null}
      </YStack>
      {children}
    </YStack>
  );
}
