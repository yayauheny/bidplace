import type { TextInputProps } from 'react-native';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & { label: string; hint?: string; error?: string; required?: boolean };

export function TextField({ label, hint, error, required, editable = true, style, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const { onBlur, onFocus, accessibilityHint, ...inputProps } = props;

  return (
    <View style={{ gap: modernTokens.space.x2 }}>
      <AppText role="label">{label}{required ? ' *' : ''}</AppText>
      {hint ? <AppText role="bodySmall" tone="secondary">{hint}</AppText> : null}
      <TextInput
        {...inputProps}
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
        placeholderTextColor={modernTokens.color.textMuted}
        style={[{ minHeight: modernTokens.size.input, borderRadius: modernTokens.radius.control, borderWidth: focused && !error ? 2 : 1, borderColor: error ? modernTokens.color.danger : focused ? modernTokens.color.ink : modernTokens.color.border, backgroundColor: modernTokens.color.surface, color: modernTokens.color.ink, paddingHorizontal: modernTokens.space.x3, paddingVertical: modernTokens.space.x2, fontFamily: modernTokens.typography.body.fontFamily, fontSize: modernTokens.typography.body.fontSize, lineHeight: modernTokens.typography.body.lineHeight, opacity: editable ? 1 : modernTokens.opacity.disabled }, style]}
      />
      {error ? <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}
    </View>
  );
}
