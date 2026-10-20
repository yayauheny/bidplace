import { forwardRef, type ReactNode } from 'react';
import { View, type TextInput, type TextInputProps } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaTextField } from '../figma/FigmaTextField';
import { type FigmaIconName } from '../figma/figma-icon-names';
import { type FigmaFieldVariant } from '../figma/figma-text-field-style';
import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  /** Adds the ` *` marker to the label. Validation is owned by the form, not by this prop. */
  required?: boolean;
  metrics?: 'default' | 'auth' | 'authPassword' | 'authScreenPassword';
  variant?: FigmaFieldVariant;
  icon?: FigmaIconName;
  iconColor?: string;
  prefix?: string;
  trailing?: ReactNode;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({
  label,
  hint,
  error,
  required,
  metrics,
  variant,
  icon,
  iconColor,
  prefix,
  trailing,
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
        metrics={metrics}
        variant={variant}
        icon={icon}
        iconColor={iconColor}
        prefix={prefix}
        trailing={trailing}
        disabled={editable === false}
      />
    </View>
  );
});
