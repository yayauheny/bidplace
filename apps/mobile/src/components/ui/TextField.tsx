import type { TextInputProps } from 'react-native';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaTextField } from '../figma/FigmaTextField';
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
  ...props
}: TextFieldProps) {
  return (
    <View style={{ gap: designTokens.space.x2, width: '100%' }}>
      {hint ? (
        <AppText role="bodySmall" tone="secondary">
          {hint}
        </AppText>
      ) : null}
      <FigmaTextField
        {...props}
        label={required ? `${label} *` : label}
        error={error}
        disabled={editable === false}
      />
    </View>
  );
}
