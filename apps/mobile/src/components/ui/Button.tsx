import type { FigmaButtonSize } from '@bidplace/design-tokens';
import type { Href } from 'expo-router';
import { View, type ViewStyle } from 'react-native';

import { FigmaButton } from '../figma/FigmaButton';

import { type FigmaIconName } from '../figma/figma-icon-names';

type ButtonPropsBase = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: FigmaIconName;
  accessibilityHint?: string;
  width?: 'content' | 'full' | 'block';
  size?: FigmaButtonSize;
  alignSelf?: ViewStyle['alignSelf'];
};

type ButtonProps =
  | (ButtonPropsBase & { href?: undefined; onPress: () => void })
  | (ButtonPropsBase & { href: Href; onPress?: () => void });

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
  disabled,
  loading,
  icon,
  accessibilityHint,
  width,
  ...action
}: Omit<ButtonProps, 'size' | 'alignSelf'>) {
  const resolvedWidth = resolvedButtonWidth(width);
  if (action.href) {
    return (
      <FigmaButton
        label={label}
        href={action.href}
        onPress={action.onPress}
        disabled={disabled}
        loading={loading}
        icon={icon}
        accessibilityHint={accessibilityHint}
        width={resolvedWidth}
        variant="ghost"
      />
    );
  }

  const { onPress } = action as { onPress: () => void };
  return (
    <FigmaButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      accessibilityHint={accessibilityHint}
      width={resolvedWidth}
      variant="ghost"
    />
  );
}
