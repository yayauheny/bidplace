import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import {
  FILTER_OPTION_CONTROL_SIZE,
  type FilterOptionRowMode,
} from './filter-option-row';

export function FilterOptionRow({
  label,
  selected = false,
  mode = 'multi',
  onPress,
}: {
  label: string;
  selected?: boolean;
  mode?: FilterOptionRowMode;
  onPress: () => void;
}) {
  return (
    <MotionPressable
      accessibilityRole={
        mode === 'disclosure' ? 'button' : mode === 'single' ? 'radio' : 'checkbox'
      }
      accessibilityLabel={label}
      accessibilityState={{
        selected: mode === 'disclosure' ? undefined : selected,
        checked: mode === 'multi' ? selected : undefined,
      }}
      onPress={onPress}
      preset="button"
      style={{
        minHeight: figmaTokens.size.touch,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        width: '100%',
      }}
    >
      {mode === 'disclosure' ? (
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={[
              { color: figmaTokens.color.ink, flex: 1 },
              figmaTokens.typography.label,
            ]}
          >
            {label}
          </Text>
          <FigmaIcon name="arrow-right-01" color={figmaTokens.color.ink} />
        </View>
      ) : (
        <>
          <View
            style={{
              width: FILTER_OPTION_CONTROL_SIZE,
              height: FILTER_OPTION_CONTROL_SIZE,
              borderRadius: mode === 'single' ? figmaTokens.radius.pill : 6,
              borderWidth: 1,
              borderColor: figmaTokens.color.ink,
              backgroundColor: selected
                ? figmaTokens.color.ink
                : 'transparent',
            }}
          />
          <Text
            style={[
              { color: figmaTokens.color.ink, flex: 1 },
              figmaTokens.typography.label,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </MotionPressable>
  );
}
