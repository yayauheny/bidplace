import type { TextInputProps } from 'react-native';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

export function TextField({
  label,
  hint,
  error,
  required,
  editable = true,
  multiline,
  style,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const { onBlur, onFocus, accessibilityHint, ...inputProps } = props;

  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="label">
        {label}
        {required ? ' *' : ''}
      </AppText>
      {hint ? (
        <AppText role="bodySmall" tone="secondary">
          {hint}
        </AppText>
      ) : null}
      <TextInput
        {...inputProps}
        multiline={multiline}
        editable={editable}
        accessibilityLabel={label}
        accessibilityHint={error ? `Ошибка: ${error}` : accessibilityHint}
        accessibilityState={{ disabled: !editable }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={designTokens.color.textMuted}
        style={[
          {
            minHeight: multiline ? 120 : designTokens.size.input,
            borderRadius: designTokens.radius.control,
            borderWidth: focused && !error ? 2 : 1,
            borderColor: error
              ? designTokens.color.danger
              : focused
                ? designTokens.color.focus
                : designTokens.color.border,
            backgroundColor: editable
              ? designTokens.color.surface
              : designTokens.color.surfaceMuted,
            color: designTokens.color.ink,
            paddingHorizontal: designTokens.space.x4,
            paddingVertical: designTokens.space.x3,
            fontFamily: designTokens.typography.body.fontFamily,
            fontSize: designTokens.typography.body.fontSize,
            lineHeight: designTokens.typography.body.lineHeight,
            opacity: editable ? 1 : designTokens.opacity.disabled,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
      />
      {error ? (
        <AppText
          role="bodySmall"
          tone="danger"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
