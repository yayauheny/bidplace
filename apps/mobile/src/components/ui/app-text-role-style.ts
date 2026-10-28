import {
  designTokens,
  typographyLetterSpacingEm,
  type TextRole,
} from '@bidplace/design-tokens';

type PlatformName = 'ios' | 'android' | 'web' | 'windows' | 'macos';

export function appTextRoleStyle(
  role: TextRole,
  platform: PlatformName,
): Record<string, string | number | undefined> {
  const spec = designTokens.typography[role] as Record<
    string,
    string | number | undefined
  > & { letterSpacingEm?: string };
  const letterSpacingEm = typographyLetterSpacingEm(role);
  const roleStyle = { ...spec };
  delete roleStyle.letterSpacingEm;
  return {
    ...roleStyle,
    letterSpacing:
      platform === 'web' && letterSpacingEm
        ? letterSpacingEm
        : spec.letterSpacing,
  };
}
