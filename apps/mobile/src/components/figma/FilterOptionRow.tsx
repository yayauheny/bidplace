import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import {
  filterOptionControlStyle,
  filterOptionLabelStyle,
  filterOptionRowStyle,
  type FilterOptionMode,
} from './filter-option-style';

export function FilterOptionRow({
  label,
  mode,
  selected,
  disabled = false,
  variant = 'default',
  onPress,
}: {
  label: string;
  mode: FilterOptionMode;
  selected: boolean;
  disabled?: boolean;
  variant?: 'default' | 'directions';
  onPress: () => void;
}) {
  const handleWebKeyDown = (event: {
    key: string;
    preventDefault: () => void;
  }) => {
    // React Native Web Pressable already activates Enter for non-button roles.
    if (disabled || event.key !== ' ') return;
    event.preventDefault();
    onPress();
  };

  return (
    <MotionPressable
      accessibilityRole={mode === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
      {...(Platform.OS === 'web'
        ? ({
            'aria-checked': selected,
            onKeyDown: handleWebKeyDown,
          } as object)
        : {})}
      disabled={disabled}
      onPress={onPress}
      preset="icon"
      style={[
        filterOptionRowStyle(),
        disabled ? { opacity: designTokens.opacity.disabled } : null,
      ]}
    >
      <AppText
        role="optionLabel"
        style={[
          filterOptionLabelStyle(),
          variant === 'directions'
            ? designTokens.typography.directionsOption
            : null,
        ]}
      >
        {label}
      </AppText>
      <View style={filterOptionControlStyle()}>
        {selected ? (
          <FigmaIcon
            name="check"
            size={designTokens.size.filterOptionCheck}
            strokeWidthPx={designTokens.stroke.filterOptionCheck}
          />
        ) : null}
      </View>
    </MotionPressable>
  );
}
