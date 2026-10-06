import { forwardRef } from 'react';
import { View, type TextInput, type TextInputProps } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaTextField } from '../figma/FigmaTextField';
import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({
  label,
  hint,
  error,
  required,
  editable = true,
  ...props
}, ref) {
  return (
    <View style={{ gap: designTokens.space.x2, width: '100%' }}>
      {hint ? (
        <AppText role="bodySmall" tone="secondary">
          {hint}
        </AppText>
      ) : null}
      <FigmaTextField
        {...props}
        ref={ref}
        label={required ? `${label} *` : label}
        error={error}
        disabled={editable === false}
      />
    </View>
  );
});
