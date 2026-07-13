import type { ReactNode } from 'react';

import { mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { Text, YStack } from 'tamagui';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const palette = useAppThemePalette();

  return (
    <AppCard style={{ alignItems: 'center' }}>
      <YStack style={{ alignItems: 'center', gap: mobileSpacing[3] }}>
        {icon}
        <Text
          style={{
            color: palette.text,
            fontSize: 18,
            lineHeight: 24,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: palette.textMuted,
            fontSize: 14,
            lineHeight: 20,
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
        {actionLabel && onAction ? (
          <AppButton onPress={onAction}>{actionLabel}</AppButton>
        ) : null}
      </YStack>
    </AppCard>
  );
}
