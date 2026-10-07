import { View, type ViewStyle } from 'react-native';

import { FigmaButton } from '../figma/FigmaButton';
import { figmaAuthActionVariant } from '../figma/figma-button-style';
import { type FigmaIconName } from '../figma/figma-icon-names';

type ButtonProps = {
  label: string;
  size?: 'regular' | 'large' | 'auth' | 'authResend';
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
  size,
  ...props
}: ButtonProps) {
  const resolvedWidth = resolvedButtonWidth(width);
  return (
    <View
      style={{
        alignSelf: alignSelf ?? (resolvedWidth === 'full' ? 'stretch' : 'flex-start'),
      }}
    >
      <FigmaButton
        {...props}
        size={compact ? 'compact' : size}
        variant={figmaAuthActionVariant(size, 'primary')}
        width={resolvedWidth}
      />
    </View>
  );
}

export function SecondaryButton({
  width = 'content',
  alignSelf,
  compact,
  size,
  ...props
}: ButtonProps) {
  const resolvedWidth = resolvedButtonWidth(width);
  return (
    <View
      style={{
        alignSelf: alignSelf ?? (resolvedWidth === 'full' ? 'stretch' : 'flex-start'),
      }}
    >
      <FigmaButton
        {...props}
        size={compact ? 'compact' : size}
        variant={figmaAuthActionVariant(size, 'secondary')}
        width={resolvedWidth}
      />
    </View>
  );
}

export function DestructiveButton({
  width = 'content',
  alignSelf,
  compact,
  size,
  ...props
}: ButtonProps) {
  const resolvedWidth = resolvedButtonWidth(width);
  return (
    <View
      style={{
        alignSelf: alignSelf ?? (resolvedWidth === 'full' ? 'stretch' : 'flex-start'),
      }}
    >
      <FigmaButton
        {...props}
        size={compact ? 'compact' : size}
        variant="danger"
        width={resolvedWidth}
      />
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
