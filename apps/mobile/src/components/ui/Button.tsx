import { View, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaButton } from '../figma/FigmaButton';
import { FigmaIcon } from '../figma/FigmaIcon';
import { type FigmaIconName } from '../figma/figma-icon-names';
import { MotionPressable } from './MotionPressable';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: FigmaIconName;
  accessibilityHint?: string;
  width?: 'content' | 'full' | 'block';
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
  icon,
  accessibilityHint,
}: Omit<ButtonProps, 'loading'>) {
  return (
    <FigmaButton
      label={label}
      onPress={onPress}
      disabled={disabled}
      icon={icon}
      accessibilityHint={accessibilityHint}
      variant="ghost"
    />
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  selected = false,
}: {
  icon: FigmaIconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
}) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled), selected }}
      disabled={disabled}
      onPress={onPress}
      preset="icon"
      style={{
        width: designTokens.size.touch,
        minHeight: designTokens.size.touch,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FigmaIcon
        name={icon}
        color={selected ? designTokens.color.solid : designTokens.color.ink}
      />
    </MotionPressable>
  );
}

export function BackButton({
  onPress,
  label = 'Назад',
}: {
  onPress: () => void;
  label?: string;
}) {
  return <IconButton icon="arrow-left-01" label={label} onPress={onPress} />;
}
