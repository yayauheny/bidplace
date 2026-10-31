import { View } from 'react-native';

import { designTokens, type SemanticColorRole } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
import { AppText } from './AppText';

const toneRole = {
  neutral: 'ink',
  accent: 'accent',
  success: 'success',
  danger: 'danger',
} as const satisfies Record<string, SemanticColorRole>;

export type StatusBadgeTone = keyof typeof toneRole;

/** NEEDS-FIGMA: no status-badge frame; caption type and semantic colors until one is agreed. */
export function StatusBadge({
  tone,
  label,
}: {
  tone: StatusBadgeTone;
  label: string;
}) {
  const palette = useAppTheme();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: designTokens.radius.pill,
        backgroundColor: palette.surfaceMuted,
        paddingHorizontal: designTokens.space.x2,
        paddingVertical: designTokens.space.x1,
      }}
    >
      <AppText role="caption" style={{ color: palette[toneRole[tone]] }}>
        {label}
      </AppText>
    </View>
  );
}
