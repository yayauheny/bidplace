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
}: {
  label: string;
  tone?: FigmaChipTone;
}) {
  return (
    <View style={figmaChipStyle(tone)}>
      <Text
        numberOfLines={1}
        style={[{ color: figmaChipTextColor(tone) }, figmaTokens.typography.chip]}
      >
        {label}
      </Text>
    </View>
  );
}
