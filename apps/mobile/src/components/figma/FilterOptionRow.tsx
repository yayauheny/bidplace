import { Platform, View } from 'react-native';

import { designTokens, figmaTokens } from '@bidplace/design-tokens';

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
  variant?: 'default' | 'directions' | 'compact';
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
        variant === 'compact'
          ? { width: '100%', minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }
          : filterOptionRowStyle(),
        disabled ? { opacity: 0.5 } : null,
      ]}
    >
      {variant !== 'compact' ? <View style={filterOptionControlStyle(mode, selected)}>
        {selected && mode === 'checkbox' && variant === 'directions' ? (
          <FigmaIcon
            name="check"
            size={figmaTokens.size.filterOptionCheck}
            color={figmaTokens.color.white}
            strokeWidthPx={figmaTokens.stroke.filterOptionCheck}
          />
        ) : null}
        {selected && mode === 'checkbox' && variant !== 'directions' ? (
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
      </View> : null}
      <AppText
        role="body"
        numberOfLines={1}
        style={[
          filterOptionLabelStyle(),
          variant === 'compact' ? { flex: 0, fontSize: 15, fontWeight: '500' as const, color: figmaTokens.color.ink } : null,
          variant === 'directions'
            ? designTokens.typography.directionsOption
            : null,
        ]}
      >
        {label}
      </AppText>
      {variant === 'compact' ? (
        <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
          {selected ? <FigmaIcon name="check" size={16} strokeWidthPx={1.5} /> : null}
        </View>
      ) : null}
    </MotionPressable>
  );
}
