import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { FigmaButton } from './FigmaButton';

export function FilterSheetActionRow({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
}) {
  return (
    <View style={{ width: '100%', paddingTop: figmaTokens.space.x3 }}>
      <FigmaButton
        label={primaryLabel}
        variant="solid"
        width="full"
        disabled={primaryDisabled}
        loading={primaryLoading}
        onPress={onPrimary}
      />
    </View>
  );
}
