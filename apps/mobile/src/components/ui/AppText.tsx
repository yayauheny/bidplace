import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from 'react-native';

import { designTokens, type TextRole } from '@bidplace/design-tokens';

type AppTextProps = PropsWithChildren<Omit<TextProps, 'role'>> & {
  role?: TextRole;
  tone?: 'default' | 'secondary' | 'muted' | 'accent' | 'danger' | 'success';
};

const toneColors = {
  default: designTokens.color.ink,
  secondary: designTokens.color.textSecondary,
  muted: designTokens.color.textMuted,
  accent: designTokens.color.ink,
  danger: designTokens.color.danger,
  success: designTokens.color.success,
} as const;

export function AppText({
  role = 'body',
  tone = 'default',
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[designTokens.typography[role], { color: toneColors[tone] }, style]}
    />
  );
}
