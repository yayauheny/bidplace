import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from 'react-native';

import { modernTokens, type ModernTextRole } from '@bidplace/design-tokens';

type AppTextProps = PropsWithChildren<Omit<TextProps, 'role'>> & {
  role?: ModernTextRole;
  tone?: 'default' | 'secondary' | 'muted' | 'accent' | 'danger' | 'success';
};

const toneColors = {
  default: modernTokens.color.ink,
  secondary: modernTokens.color.textSecondary,
  muted: modernTokens.color.textMuted,
  accent: modernTokens.color.accent,
  danger: modernTokens.color.danger,
  success: modernTokens.color.success,
} as const;

export function AppText({ role = 'body', tone = 'default', style, ...props }: AppTextProps) {
  return <Text {...props} style={[modernTokens.typography[role], { color: toneColors[tone] }, style]} />;
}
