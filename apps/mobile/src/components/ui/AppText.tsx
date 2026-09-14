import type { PropsWithChildren } from 'react';
import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

import { designTokens, type TextRole } from '@bidplace/design-tokens';

import { appTextRoleStyle } from './app-text-role-style';

type AppTextProps = PropsWithChildren<Omit<TextProps, 'role'>> & {
  role?: TextRole;
  tone?:
    | 'default'
    | 'secondary'
    | 'subdued'
    | 'subtle'
    | 'muted'
    | 'accent'
    | 'danger'
    | 'success';
};

const toneColors = {
  default: designTokens.color.ink,
  secondary: designTokens.color.textSecondary,
  subdued: designTokens.color.textSubdued,
  subtle: designTokens.color.textSubtle,
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
      style={[
        appTextRoleStyle(role, Platform.OS) as TextStyle,
        { color: toneColors[tone] },
        style,
      ]}
    />
  );
}

export { appTextRoleStyle } from './app-text-role-style';
