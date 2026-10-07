import { useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { figmaFieldNativeOutlineStyle } from '../../components/figma/figma-text-field-style';
import { normalizeEmailVerificationCode } from './author-email-verification';

const CELLS = [0, 1, 2, 3, 4, 5] as const;

export function AuthCodeField({
  value,
  onChangeText,
  error,
}: {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? designTokens.color.error
    : focused
      ? designTokens.color.focus
      : designTokens.color.muted;

  return (
    <View style={{ width: '100%', gap: designTokens.space.x2 }}>
      <View style={{ position: 'relative', minHeight: designTokens.size.input }}>
        <View
          pointerEvents="none"
          style={{ flexDirection: 'row', gap: designTokens.auth.codeGap }}
        >
          {CELLS.map((index) => (
              <View
                key={index}
                accessibilityElementsHidden
                importantForAccessibility="no"
                {...(Platform.OS === 'web' ? { dataSet: { authCodeCell: 'true' } } : {})}
                style={{
                flex: 1,
                height: designTokens.size.input,
                borderRadius: designTokens.auth.codeRadius,
                borderWidth: designTokens.size.fieldBorder,
                borderColor,
                backgroundColor: designTokens.color.canvas,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: designTokens.color.fieldValue,
                  ...designTokens.typography.authSheetTitle,
                }}
              >
                {value[index] ?? ''}
              </Text>
            </View>
          ))}
        </View>
        <TextInput
          accessibilityLabel="Код из письма"
          accessibilityHint={error ? `Ошибка: ${error}` : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="one-time-code"
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={6}
          value={value}
          onChangeText={(next) => onChangeText(normalizeEmailVerificationCode(next))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            color: 'transparent',
            ...designTokens.typography.authSheetTitle,
            ...(Platform.OS === 'web' ? (figmaFieldNativeOutlineStyle as object) : null),
          }}
        />
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: designTokens.color.error,
            ...designTokens.typography.fieldError,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
