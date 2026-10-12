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

type TextButtonProps = Omit<ButtonProps, 'size' | 'alignSelf'>;

function isPressButtonProps(
  props: TextButtonProps,
): props is TextButtonProps & ButtonPressAction {
  return !('href' in props);
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

export function TextButton(props: TextButtonProps) {
  const { label, disabled, loading, icon, accessibilityHint, width } = props;
  const resolvedWidth = resolvedButtonWidth(width);
  const shared = {
    label,
    disabled,
    loading,
    icon,
    accessibilityHint,
    width: resolvedWidth,
    variant: 'ghost' as const,
  };

  if (isPressButtonProps(props)) {
    return <FigmaButton {...shared} onPress={props.onPress} />;
  }

  const { href } = props;
  if (href === undefined) {
    throw new Error('TextButton requires href or onPress');
  }

  return <FigmaButton {...shared} href={href} />;
}
