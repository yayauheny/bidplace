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
  nativeID,
  tabIndex,
  onNavigate,
}: {
  label: string;
  mode: FilterOptionMode;
  selected: boolean;
  disabled?: boolean;
  variant?: 'default' | 'directions';
  onPress: () => void;
  nativeID?: string;
  tabIndex?: number;
  onNavigate?: (direction: 'previous' | 'next' | 'first' | 'last') => void;
}) {
  const handleWebKeyDown = (event: {
    key: string;
    preventDefault: () => void;
  }) => {
    // React Native Web Pressable already activates Enter for non-button roles.
    if (disabled) return;
    if (mode === 'radio' && onNavigate) {
      const direction =
        event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? 'previous'
          : event.key === 'ArrowDown' || event.key === 'ArrowRight'
            ? 'next'
            : event.key === 'Home'
              ? 'first'
              : event.key === 'End'
                ? 'last'
                : undefined;
      if (direction) {
        event.preventDefault();
        onNavigate(direction);
        return;
      }
    }
    if (event.key !== ' ') return;
    event.preventDefault();
    onPress();
  };

  return (
    <MotionPressable
      nativeID={nativeID}
      accessibilityRole={mode === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
      {...(Platform.OS === 'web'
        ? ({
            'aria-checked': selected,
            onKeyDown: handleWebKeyDown,
            ...(tabIndex === undefined ? {} : { tabIndex }),
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
