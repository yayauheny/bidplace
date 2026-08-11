import { ActivityIndicator, View, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppIcon, type AppIconName } from './AppIcon';
import { AppText } from './AppText';
import { MotionPressable } from './MotionPressable';
import type { MotionPressableState } from './MotionPressable';
import {
  buttonContentLayoutStyle,
  buttonLayoutStyle,
  buttonLoadingOverlayStyle,
  type ButtonWidth,
} from './button-layout';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: AppIconName;
  accessibilityHint?: string;
  width?: ButtonWidth;
  alignSelf?: ViewStyle['alignSelf'];
  compact?: boolean;
};

function ButtonContent({
  label,
  loading,
  icon,
  color,
}: Pick<ButtonProps, 'label' | 'loading' | 'icon'> & { color: string }) {
  const hasIcon = Boolean(icon);
  return (
    <View style={buttonContentLayoutStyle(hasIcon)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: hasIcon ? designTokens.space.x2 : 0,
          opacity: loading ? 0 : 1,
        }}
      >
        {icon ? <AppIcon name={icon} color={color} /> : null}
        <AppText role="button" style={{ color }} numberOfLines={1}>
          {label}
        </AppText>
      </View>
      {loading ? (
        <ActivityIndicator
          color={color}
          size="small"
          style={buttonLoadingOverlayStyle()}
        />
      ) : null}
    </View>
  );
}

function ButtonBase({
  label,
  onPress,
  disabled,
  loading,
  icon,
  accessibilityHint,
  width = 'content',
  compact = false,
  alignSelf,
  style,
  textColor,
}: ButtonProps & {
  style: ViewStyle | ((state: MotionPressableState) => ViewStyle);
  textColor: string;
}) {
  const inactive = disabled || loading;
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      aria-busy={loading || undefined}
      disabled={inactive}
      onPress={onPress}
      preset="primaryAction"
      style={(state: MotionPressableState) => [
        {
          minHeight: compact
            ? designTokens.size.buttonCompact
            : designTokens.size.button,
          justifyContent: 'center',
          ...buttonLayoutStyle(width, alignSelf),
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <ButtonContent
        label={label}
        loading={loading}
        icon={icon}
        color={textColor}
      />
    </MotionPressable>
  );
}

export function PrimaryButton(props: ButtonProps) {
  return (
    <ButtonBase
      {...props}
      textColor={designTokens.color.surface}
      style={({ hovered, pressed }) => ({
        borderRadius: props.compact
          ? designTokens.radius.compact
          : designTokens.radius.button,
        backgroundColor:
          hovered || pressed
            ? designTokens.color.actionHover
            : designTokens.color.action,
      })}
    />
  );
}

export function SecondaryButton(props: ButtonProps) {
  return (
    <ButtonBase
      {...props}
      textColor={designTokens.color.ink}
      style={({ hovered, pressed }) => ({
        borderRadius: props.compact
          ? designTokens.radius.compact
          : designTokens.radius.button,
        borderWidth: 1,
        borderColor:
          hovered || pressed
            ? designTokens.color.borderStrong
            : designTokens.color.border,
        backgroundColor:
          hovered || pressed
            ? designTokens.color.surfaceStrong
            : designTokens.color.surface,
      })}
    />
  );
}

export function DestructiveButton(props: ButtonProps) {
  return (
    <ButtonBase
      {...props}
      textColor={designTokens.color.surface}
      style={({ hovered, pressed }) => ({
        borderRadius: props.compact
          ? designTokens.radius.compact
          : designTokens.radius.button,
        backgroundColor:
          hovered || pressed ? '#963030' : designTokens.color.danger,
      })}
    />
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
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      preset="button"
      style={{
        minHeight: designTokens.size.touch,
        alignSelf: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x1,
        }}
      >
        {icon ? (
          <AppIcon name={icon} color={designTokens.color.accentDark} />
        ) : null}
        <AppText
          role="label"
          tone="accent"
          style={{ textDecorationLine: 'underline' }}
        >
          {label}
        </AppText>
      </View>
    </MotionPressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  selected = false,
}: {
  icon: AppIconName;
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
      style={({ hovered, pressed }) => ({
        width: designTokens.size.touch,
        minHeight: designTokens.size.touch,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: designTokens.radius.pill,
        backgroundColor: selected
          ? designTokens.color.action
          : hovered || pressed
            ? designTokens.color.surfaceStrong
            : 'transparent',
      })}
    >
      <AppIcon
        name={icon}
        color={selected ? designTokens.color.surface : designTokens.color.ink}
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
  return <IconButton icon="chevronLeft" label={label} onPress={onPress} />;
}
