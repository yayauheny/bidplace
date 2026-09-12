import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaChipStyle,
  figmaChipTextColor,
  type FigmaChipTone,
} from './figma-chip-style';

export function FigmaChip({
  label,
  tone = 'onLight',
  size = 'compact',
}: {
  label: string;
  tone?: FigmaChipTone;
  size?: 'compact' | 'profile';
}) {
  return (
    <View style={[figmaChipStyle(tone), size === 'profile' && {
      paddingHorizontal: figmaTokens.space.authorChipX,
      paddingVertical: figmaTokens.space.authorChipY,
    }]}>
      <Text
        numberOfLines={1}
        style={[{ color: figmaChipTextColor(tone) }, size === 'profile' ? figmaTokens.typography.profileChip : figmaTokens.typography.chip]}
      >
        {label}
      </Text>
    </View>
  );
}
