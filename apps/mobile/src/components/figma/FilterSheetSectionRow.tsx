import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import { filterSheetSectionRowStyle } from './filter-sheet-style';

export function FilterSheetSectionRow({
  label,
  valuePreview,
  onPress,
  disabled = false,
  compact = false,
}: {
  label: string;
  valuePreview?: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={valuePreview ? `${label}, ${valuePreview}` : label}
      disabled={disabled}
      onPress={onPress}
      preset="icon"
      style={[
        filterSheetSectionRowStyle(compact),
        disabled ? { opacity: 0.5 } : null,
      ]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText role={compact ? "body" : "profileHeading"} numberOfLines={1}>
          {label}
        </AppText>
        {valuePreview && !compact ? (
          <AppText role="caption" tone="secondary" numberOfLines={1}>
            {valuePreview}
          </AppText>
        ) : null}
      </View>
      {compact && valuePreview && valuePreview !== "Не выбрано" ? (
        <AppText role="caption" tone="secondary" numberOfLines={1} style={{ maxWidth: "38%" }}>
          {valuePreview}
        </AppText>
      ) : null}
      <FigmaIcon
        name="arrow-right-01"
        size={figmaTokens.size.dockIcon}
        color={figmaTokens.color.ink}
      />
    </MotionPressable>
  );
}
