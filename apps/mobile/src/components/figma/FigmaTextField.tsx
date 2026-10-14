import {
  forwardRef,
  useId,
  useState,
  type ComponentRef,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Platform,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from './FigmaIcon';
import { type FigmaIconName } from './figma-icon-names';
import {
  figmaFieldNativeOutlineStyle,
  figmaFieldPlaceholderColor,
  figmaFieldShowsFloatingLabel,
  figmaFieldStatus,
  figmaFieldStyle,
  figmaFieldValueColor,
  type FigmaFieldVariant,
} from './figma-text-field-style';

type FigmaTextFieldProps = Omit<TextInputProps, 'editable'> & {
  label: string;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  icon?: FigmaIconName;
  iconColor?: string;
  prefix?: string;
  metrics?: 'default' | 'authPassword' | 'authScreenPassword';
  variant?: FigmaFieldVariant;
  trailing?: ReactNode;
};

type FieldInputProps = TextInputProps & {
  dataSet?: Record<string, string>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/** react-native-web sets data-* from dataSet. The React Native TextInput types omit that prop. */
function FieldInput(props: FieldInputProps) {
  return <TextInput {...(props as TextInputProps)} />;
}

export const FigmaTextField = forwardRef<TextInput, FigmaTextFieldProps>(
  function FigmaTextField(
    {
      label,
      error,
      success = false,
      disabled = false,
      icon,
      iconColor = designTokens.color.fieldValue,
      prefix,
      metrics = 'default',
      variant = 'default',
      trailing,
      value,
      defaultValue,
      placeholder,
      multiline = false,
      onChangeText,
      onFocus,
      onBlur,
      style: inputStyle,
      ...props
    },
    ref,
  ) {
    const errorId = useId();
    const [focused, setFocused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [uncontrolledFilled, setUncontrolledFilled] = useState(
      String(defaultValue ?? '').length > 0,
    );
    const filled =
      value === undefined ? uncontrolledFilled : String(value).length > 0;
    const status = figmaFieldStatus({
      disabled,
      error: Boolean(error),
      success: success && !error,
      focused,
      hovered,
      filled: filled || focused,
    });
    const showLabel = figmaFieldShowsFloatingLabel(status);
    const valueColor = figmaFieldValueColor(status);

    const field = (
      <View style={{ width: '100%' }}>
        <View style={figmaFieldStyle(status, multiline, metrics, variant)}>
          {icon ? (
            <View style={{ padding: designTokens.space.iconPad }}>
              <FigmaIcon
                name={icon}
                color={iconColor}
                strokeWidthPx={
                  variant === 'authorApplication'
                    ? designTokens.stroke.authorApplicationFieldPx
                    : undefined
                }
              />
            </View>
          ) : null}
          {prefix ? (
            <Text
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{
                color: designTokens.color.fieldValue,
                ...designTokens.typography.field,
              }}
            >
              {prefix}
            </Text>
          ) : null}
          <FieldInput
            {...props}
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            editable={!disabled}
            accessibilityLabel={label}
            accessibilityHint={
              error ? `Ошибка: ${error}` : props.accessibilityHint
            }
            accessibilityState={{ disabled }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            placeholder={showLabel ? undefined : (placeholder ?? label)}
            placeholderTextColor={figmaFieldPlaceholderColor(status, variant)}
            multiline={multiline}
            dataSet={Platform.OS === 'web' ? { figmaField: 'true' } : undefined}
            onChangeText={(nextValue) => {
              if (value === undefined) {
                setUncontrolledFilled(nextValue.length > 0);
              }
              onChangeText?.(nextValue);
            }}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            style={[
              {
                flex: 1,
                minWidth: 0,
                color: valueColor,
                padding: 0,
                textAlignVertical: multiline ? 'top' : 'center',
                ...(metrics === 'authPassword' ||
                metrics === 'authScreenPassword'
                  ? designTokens.typography.authPassword
                  : designTokens.typography.field),
                ...(Platform.OS === 'web'
                  ? (figmaFieldNativeOutlineStyle as object)
                  : null),
              },
              inputStyle,
            ]}
          />
          {trailing}
          {showLabel ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: designTokens.space.fieldLabelX,
                top: designTokens.space.fieldLabelY,
                paddingHorizontal: 4,
                backgroundColor: designTokens.color.canvas,
              }}
            >
              <Text
                style={{
                  color: designTokens.color.fieldLabel,
                  ...designTokens.typography.fieldLabel,
                }}
              >
                {label}
              </Text>
            </View>
          ) : null}
        </View>
        {error ? (
          <Text
            nativeID={errorId}
            accessibilityLiveRegion="polite"
            style={{
              marginTop: designTokens.space.fieldErrorGap,
              marginLeft: designTokens.space.fieldErrorX,
              marginRight: designTokens.space.fieldX,
              color: designTokens.color.error,
              ...designTokens.typography.fieldError,
            }}
          >
            {error}
          </Text>
        ) : null}
      </View>
    );

    if (Platform.OS !== 'web') {
      return field;
    }

    return (
      <View
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {field}
      </View>
    );
  },
);
