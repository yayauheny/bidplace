import type { PropsWithChildren } from 'react';
import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

import type { SemanticColorRole, TextRole } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
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
    | 'success'
    | 'strong';
};

// tone → semantic color role; the role resolves to a value per active theme
// at render time, never from a module-level snapshot.
const toneRoles: Record<
  NonNullable<AppTextProps['tone']>,
  SemanticColorRole
> = {
  default: 'ink',
  strong: 'inkStrong',
  secondary: 'textSecondary',
  subdued: 'textSubdued',
  subtle: 'textSubtle',
  muted: 'textMuted',
  accent: 'ink',
  danger: 'danger',
  success: 'success',
};

export function AppText({
  role = 'body',
  tone = 'default',
  style,
  ...props
}: AppTextProps) {
  const colors = useAppTheme();
  return (
    <Text
      {...props}
      style={[
        appTextRoleStyle(role, Platform.OS) as TextStyle,
        { color: colors[toneRoles[tone]] },
        style,
      ]}
    />
  );
}

export { appTextRoleStyle } from './app-text-role-style';
