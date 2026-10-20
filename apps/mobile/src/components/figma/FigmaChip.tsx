import { Text, View } from 'react-native';

import { useAppTheme } from '../../providers/theme-provider';
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
  const palette = useAppTheme();

  // Retained native compatibility: React Native has no mask-composite
  // gradient stroke, so native keeps the existing flat border.
  return (
    <View style={[figmaChipStyle(tone, palette), figmaChipSizeStyle(size)]}>
      <Text
        numberOfLines={1}
        style={[
          { color: figmaChipTextColor(tone, size, palette) },
          figmaChipTypography(size),
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
