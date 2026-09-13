import { Text, View } from 'react-native';

import {
  figmaChipSizeStyle,
  figmaChipStyle,
  figmaChipTextColor,
  figmaChipTypography,
  type FigmaChipSize,
  type FigmaChipTone,
} from './figma-chip-style';

export function FigmaChip({
  label,
  tone = 'onLight',
  size = 'compact',
}: {
  label: string;
  tone?: FigmaChipTone;
  size?: FigmaChipSize;
}) {
  return (
    <View style={[figmaChipStyle(tone), figmaChipSizeStyle(size)]}>
      <Text
        numberOfLines={1}
        style={[
          { color: figmaChipTextColor(tone, size) },
          figmaChipTypography(size),
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
