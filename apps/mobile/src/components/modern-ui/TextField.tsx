import type { TextInputProps } from 'react-native';
import { TextInput, View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & { label: string; hint?: string; error?: string; required?: boolean };

export function TextField({ label, hint, error, required, editable = true, style, ...props }: TextFieldProps) {
  return (
    <View style={{ gap: modernTokens.space.x2 }}>
      <AppText role="label">{label}{required ? ' *' : ''}</AppText>
      {hint ? <AppText role="bodySmall" tone="secondary">{hint}</AppText> : null}
      <TextInput
        {...props}
        editable={editable}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !editable }}
        placeholderTextColor={modernTokens.color.textMuted}
        style={[{ minHeight: modernTokens.size.input, borderRadius: modernTokens.radius.control, borderWidth: 1, borderColor: error ? modernTokens.color.danger : modernTokens.color.border, backgroundColor: modernTokens.color.surface, color: modernTokens.color.ink, paddingHorizontal: modernTokens.space.x3, paddingVertical: modernTokens.space.x2, fontFamily: modernTokens.typography.body.fontFamily, fontSize: modernTokens.typography.body.fontSize, lineHeight: modernTokens.typography.body.lineHeight, opacity: editable ? 1 : 0.5 }, style]}
      />
      {error ? <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}
    </View>
  );
}
