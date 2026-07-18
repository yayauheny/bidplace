import { Text, XStack } from 'tamagui';

import { mobileSpacing } from '../../theme/tokens';

type ColorSwatchesProps = {
  colors: readonly string[];
  extraCount?: number;
};

export function ColorSwatches({ colors, extraCount = 0 }: ColorSwatchesProps) {
  return (
    <XStack style={{ alignItems: 'center', gap: mobileSpacing['1.5'] }}>
      {colors.map((color, index) => (
        <XStack
          key={`${color}-${index}`}
          style={{
            width: 13,
            height: 13,
            borderWidth: 1,
            borderColor: '#DFDDD7',
            backgroundColor: color,
          }}
        />
      ))}
      {extraCount > 0 ? (
        <Text color="$textMuted" fontSize={12} lineHeight={16}>
          +{extraCount}
        </Text>
      ) : null}
    </XStack>
  );
}
