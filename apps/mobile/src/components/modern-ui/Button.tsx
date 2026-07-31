import { ActivityIndicator, View, type ViewStyle } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppIcon, type AppIconName } from './AppIcon';
import { AppText } from './AppText';
import { MotionPressable } from './MotionPressable';
import { buttonLayoutStyle, type ButtonWidth } from './button-layout';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: AppIconName;
  accessibilityHint?: string;
  width?: ButtonWidth;
};

function ButtonContent({
  label,
  loading,
  icon,
  color,
}: Pick<ButtonProps, 'label' | 'loading' | 'icon'> & { color: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: modernTokens.space.x2,
      }}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : icon ? (
        <AppIcon name={icon} color={color} />
      ) : null}
      <AppText role="button" style={{ color }}>
        {loading ? 'Загрузка' : label}
      </AppText>
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
  style,
  textColor,
}: ButtonProps & { style: ViewStyle; textColor: string }) {
  const inactive = disabled || loading;
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      preset="primaryAction"
      style={[
        {
          minHeight: modernTokens.size.button,
          justifyContent: 'center',
          ...buttonLayoutStyle(width),
        },
        style,
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
      textColor={modernTokens.color.surface}
      style={{
        borderRadius: modernTokens.radius.button,
        backgroundColor: modernTokens.color.ink,
      }}
    />
  );
}

export function SecondaryButton(props: ButtonProps) {
  return (
    <ButtonBase
      {...props}
      textColor={modernTokens.color.ink}
      style={{
        borderRadius: modernTokens.radius.button,
        borderWidth: 1,
        borderColor: modernTokens.color.border,
        backgroundColor: modernTokens.color.surface,
      }}
    />
  );
}

export function DestructiveButton(props: ButtonProps) {
  return (
    <ButtonBase
      {...props}
      textColor={modernTokens.color.surface}
      style={{
        borderRadius: modernTokens.radius.button,
        backgroundColor: modernTokens.color.danger,
      }}
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
        minHeight: modernTokens.size.touch,
        alignSelf: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: modernTokens.space.x1,
        }}
      >
        {icon ? (
          <AppIcon name={icon} color={modernTokens.color.accent} />
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
      style={{
        width: modernTokens.size.touch,
        minHeight: modernTokens.size.touch,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: modernTokens.radius.pill,
        backgroundColor: selected ? modernTokens.color.ink : 'transparent',
      }}
    >
      <AppIcon
        name={icon}
        color={selected ? modernTokens.color.surface : modernTokens.color.ink}
        label={label}
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
