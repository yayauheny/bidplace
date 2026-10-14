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

type ButtonPressAction = {
  href?: never;
  onPress: () => void;
};

type ButtonNavigationAction = {
  href: Href;
  onPress?: never;
};

export type ButtonProps = ButtonPropsBase &
  (ButtonPressAction | ButtonNavigationAction);

function resolvedButtonWidth(width: ButtonProps['width']) {
  return width === 'block' ? 'full' : (width ?? 'content');
}

export type TextButtonProps = Omit<ButtonPropsBase, 'size' | 'alignSelf'> &
  (ButtonPressAction | ButtonNavigationAction);

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

export function TextButton({ width, ...props }: TextButtonProps) {
  return (
    <FigmaButton
      {...props}
      variant="ghost"
      width={resolvedButtonWidth(width)}
    />
  );
}
