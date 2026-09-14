import { View, type ViewStyle } from 'react-native';

import { FigmaButton } from '../figma/FigmaButton';
import { FigmaIconButton } from '../figma/FigmaIconButton';
import { type FigmaIconName } from '../figma/figma-icon-names';

type ButtonProps = {
  label: string;
  size?: 'regular' | 'large';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: FigmaIconName;
  accessibilityHint?: string;
  width?: 'content' | 'full' | 'block';
  alignSelf?: ViewStyle['alignSelf'];
  compact?: boolean;
};

function resolvedButtonWidth(width: ButtonProps['width']) {
  return width === 'block' ? 'full' : (width ?? 'content');
}

export function PrimaryButton({
  width = 'content',
  alignSelf,
  compact,
  ...props
}: ButtonProps) {
  void compact;
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
  compact,
  ...props
}: ButtonProps) {
  void compact;
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
  compact,
  ...props
}: ButtonProps) {
  void compact;
  const resolvedWidth = resolvedButtonWidth(width);
  return (
    <View
      style={{
        alignSelf: alignSelf ?? (resolvedWidth === 'full' ? 'stretch' : 'flex-start'),
      }}
    >
      <FigmaButton {...props} variant="danger" width={resolvedWidth} />
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
    <FigmaIconButton
      icon={icon}
      label={label}
      onPress={onPress}
      disabled={disabled}
      selected={selected}
    />
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
