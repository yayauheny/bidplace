import { ActivityIndicator, Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import { type FigmaIconName } from './figma-icon-names';
import {
  figmaButtonLabelColor,
  figmaButtonStyle,
  type FigmaButtonVariant,
} from './figma-button-style';

export function FigmaButton({
  label,
  onPress,
  variant = 'solid',
  disabled = false,
  loading = false,
  icon,
  accessibilityHint,
  width = 'content',
}: {
  label: string;
  onPress: () => void;
  variant?: FigmaButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: FigmaIconName;
  accessibilityHint?: string;
  width?: 'content' | 'full';
}) {
  const inactive = disabled || loading;
  const textColor = figmaButtonLabelColor(variant);

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      preset="primaryAction"
      style={({ hovered, pressed }) => [
        { position: 'relative', alignSelf: width === 'full' ? 'stretch' : 'flex-start' },
        width === 'full' ? { width: '100%' } : null,
        figmaButtonStyle(
          variant,
          inactive ? 'disabled' : pressed ? 'pressed' : hovered ? 'hover' : 'idle',
        ),
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: icon ? 2 : 0,
          opacity: loading ? 0 : 1,
        }}
      >
        {icon ? <FigmaIcon name={icon} color={textColor} /> : null}
        <Text style={[{ color: textColor }, figmaTokens.typography.button]}>
          {label}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator
          color={textColor}
          size="small"
          style={{ position: 'absolute' }}
        />
      ) : null}
    </MotionPressable>
  );
}
