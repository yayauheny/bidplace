import type { ComponentPropsWithoutRef } from 'react';

import { radius, spacing } from '../../theme/tokens';
import { Text } from './layout';
import { XStack, YStack } from './stack';

type StackProps = ComponentPropsWithoutRef<typeof YStack>;
type XStackProps = ComponentPropsWithoutRef<typeof XStack>;

export function Card({ children, ...props }: StackProps) {
  return (
    <YStack
      gap={spacing[4]}
      borderRadius={radius.lg}
      borderWidth={1}
      borderColor="var(--borderColor)"
      backgroundColor="var(--surface)"
      padding={spacing[4]}
      shadowColor="rgba(0, 0, 0, 0.16)"
      shadowOpacity={1}
      shadowRadius={24}
      shadowOffset={{ width: 0, height: 8 }}
      {...props}
    >
      {children}
    </YStack>
  );
}

export function Badge({ children, ...props }: XStackProps) {
  return (
    <XStack
      alignItems="center"
      borderRadius={radius.full}
      paddingHorizontal={spacing[2]}
      paddingVertical={spacing[1]}
      gap={spacing[1]}
      backgroundColor="var(--backgroundMuted)"
      borderWidth={1}
      borderColor="var(--borderColor)"
      {...props}
    >
      {children}
    </XStack>
  );
}

type StatusTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

type StatusBadgeProps = {
  tone?: StatusTone;
  children: string;
};

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  const backgroundColor =
    tone === 'accent'
      ? 'var(--accentSoft)'
      : tone === 'success'
        ? 'var(--success)'
        : tone === 'warning'
          ? 'var(--warning)'
          : tone === 'danger'
            ? 'var(--danger)'
            : 'var(--backgroundMuted)';

  const borderColor =
    tone === 'accent'
      ? 'var(--accentMuted)'
      : tone === 'success'
        ? 'var(--success)'
        : tone === 'warning'
          ? 'var(--warning)'
          : tone === 'danger'
            ? 'var(--danger)'
            : 'var(--borderColor)';

  const textTone =
    tone === 'neutral'
      ? 'muted'
      : tone === 'accent'
        ? 'accent'
        : tone === 'success'
          ? 'success'
          : tone === 'warning'
            ? 'default'
            : 'danger';

  return (
    <Badge backgroundColor={backgroundColor} borderColor={borderColor}>
      <Text size="caption" weight="strong" tone={textTone}>
        {children}
      </Text>
    </Badge>
  );
}
