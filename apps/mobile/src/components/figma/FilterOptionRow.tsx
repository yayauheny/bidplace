import { Platform, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
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
  onPress,
}: {
  label: string;
  mode: FilterOptionMode;
  selected: boolean;
  disabled?: boolean;
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
      style={[filterOptionRowStyle(), disabled ? { opacity: 0.5 } : null]}
    >
      <View style={filterOptionControlStyle(mode, selected)}>
        {selected && mode === 'checkbox' ? (
          <View
            style={{
              width: 10,
              height: 6,
              marginTop: -2,
              borderLeftWidth: 1.5,
              borderBottomWidth: 1.5,
              borderColor: figmaTokens.color.white,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        ) : null}
        {selected && mode === 'radio' ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: figmaTokens.color.white,
            }}
          />
        ) : null}
      </View>
      <AppText
        role="body"
        numberOfLines={1}
        style={filterOptionLabelStyle()}
      >
        {label}
      </AppText>
    </MotionPressable>
  );
}
