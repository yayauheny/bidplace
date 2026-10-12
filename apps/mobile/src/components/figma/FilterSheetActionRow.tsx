import { View } from 'react-native';

import {
  designTokens,
  figmaTokens,
  type FigmaButtonSize,
} from '@bidplace/design-tokens';

import { FigmaButton } from './FigmaButton';

export function FilterSheetActionRow({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  size = 'matrix',
  variant = 'default',
}: {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  size?: FigmaButtonSize;
  variant?: 'default' | 'directions';
}) {
  return (
    <View
      style={{
        width: '100%',
        paddingTop: figmaTokens.space.x3,
        paddingLeft:
          variant === 'directions'
            ? designTokens.authorApplication.directionsContentInset
            : 0,
      }}
    >
      <FigmaButton
        label={primaryLabel}
        variant="solid"
        size={size}
        width="full"
        disabled={primaryDisabled}
        loading={primaryLoading}
        onPress={onPrimary}
      />
    </View>
  );
}
