import { forwardRef, useId, useState, type ComponentRef, type Ref } from 'react';
import { Platform, Text, TextInput, View, type TextInputProps } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from './FigmaIcon';
import { type FigmaIconName } from './figma-icon-names';
import {
  figmaFieldNativeOutlineStyle,
  figmaFieldShowsFloatingLabel,
  figmaFieldStatus,
  figmaFieldStyle,
  figmaFieldValueColor,
} from './figma-text-field-style';

type FigmaTextFieldProps = Omit<TextInputProps, 'editable'> & {
  label: string;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  icon?: FigmaIconName;
};

type FieldInputProps = TextInputProps & {
  dataSet?: Record<string, string>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/** react-native-web sets data-* from dataSet. The React Native TextInput types omit that prop. */
function FieldInput(props: FieldInputProps) {
  return <TextInput {...(props as TextInputProps)} />;
}

export const FigmaTextField = forwardRef<TextInput, FigmaTextFieldProps>(function FigmaTextField({
  label,
  error,
  success = false,
  disabled = false,
  icon,
  value,
  defaultValue,
  placeholder,
  multiline = false,
  onChangeText,
  onFocus,
  onBlur,
  style: inputStyle,
  ...props
}, ref) {
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
      <View style={figmaFieldStyle(status, multiline)}>
        {icon ? (
          <View style={{ padding: figmaTokens.space.iconPad }}>
            <FigmaIcon name={icon} color={figmaTokens.color.fieldValue} />
          </View>
        ) : null}
        <FieldInput
          {...props}
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          editable={!disabled}
          accessibilityLabel={label}
          accessibilityHint={error ? `Ошибка: ${error}` : props.accessibilityHint}
          accessibilityState={{ disabled }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder={showLabel ? undefined : (placeholder ?? label)}
          placeholderTextColor={figmaTokens.color.muted}
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
              ...figmaTokens.typography.field,
              ...(Platform.OS === 'web' ? (figmaFieldNativeOutlineStyle as object) : null),
            },
            inputStyle,
          ]}
        />
        {showLabel ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: figmaTokens.space.fieldLabelX,
              top: figmaTokens.space.fieldLabelY,
              paddingHorizontal: 4,
              backgroundColor: figmaTokens.color.canvas,
            }}
          >
            <Text
              style={{
                color: figmaTokens.color.fieldLabel,
                ...figmaTokens.typography.fieldLabel,
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
            marginTop: figmaTokens.space.fieldErrorGap,
            marginLeft: figmaTokens.space.fieldErrorX,
            marginRight: figmaTokens.space.fieldX,
            color: figmaTokens.color.error,
            ...figmaTokens.typography.fieldError,
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
});
