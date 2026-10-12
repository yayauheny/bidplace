import type { FigmaButtonSize } from '@bidplace/design-tokens';
import { View, type ViewStyle } from 'react-native';

import { FigmaButton } from '../figma/FigmaButton';

import { type FigmaIconName } from '../figma/figma-icon-names';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: FigmaIconName;
  accessibilityHint?: string;
  width?: 'content' | 'full' | 'block';
  size?: FigmaButtonSize;
  alignSelf?: ViewStyle['alignSelf'];
};

function resolvedButtonWidth(width: ButtonProps['width']) {
  return width === 'block' ? 'full' : (width ?? 'content');
}

export function PrimaryButton({
  width = 'content',
  alignSelf,
  ...props
}: ButtonProps) {
  const resolvedWidth = resolvedButtonWidth(width);
  return (
    <View
      style={{
        alignSelf: alignSelf ?? (resolvedWidth === 'full' ? 'stretch' : 'flex-start'),
      }}
    >
      <FigmaButton {...props} variant="solid" width={resolvedWidth} />
    </View>
  );
}

export function SecondaryButton({
  width = 'content',
  alignSelf,
  ...props
}: ButtonProps) {
  const resolvedWidth = resolvedButtonWidth(width);
  return (
    <View
      style={{
        alignSelf: alignSelf ?? (resolvedWidth === 'full' ? 'stretch' : 'flex-start'),
      }}
    >
      <FigmaButton {...props} variant="outline" width={resolvedWidth} />
    </View>
  );
}

export function DestructiveButton({
  width = 'content',
  alignSelf,
  ...props
}: ButtonProps) {
  const resolvedWidth = resolvedButtonWidth(width);
  return (
    <View
      style={{
        alignSelf: alignSelf ?? (resolvedWidth === 'full' ? 'stretch' : 'flex-start'),
      }}
    >
      <FigmaButton {...props} variant="solid" width={resolvedWidth} />
    </View>
  );
}

export function TextButton({
  label,
  onPress,
  disabled,
  loading,
  icon,
  accessibilityHint,
  width,
}: Omit<ButtonProps, 'size' | 'alignSelf'>) {
  return (
    <FigmaButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      accessibilityHint={accessibilityHint}
      width={resolvedButtonWidth(width)}
      variant="ghost"
    />
  );
}
