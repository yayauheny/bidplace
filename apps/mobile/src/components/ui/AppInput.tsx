import type { TextInputProps } from 'react-native';
import { TextInput } from 'react-native';
import { useId } from 'react';

import { mobileRadius, mobileSpacing, mobileSizes } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { FormField } from './FormField';

export type AppInputProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  id?: string;
  editable?: boolean;
} & TextInputProps;

export function AppInput({
  label,
  description,
  error,
  required,
  id,
  multiline,
  style,
  ...props
}: AppInputProps) {
  const generatedId = useId();
  const palette = useAppThemePalette();
  const controlId = id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={controlId}
      descriptionId={descriptionId}
      errorId={errorId}
    >
      <TextInput
        {...props}
        id={controlId}
        multiline={multiline}
        placeholderTextColor={palette.colorMuted}
        style={[
          {
            minHeight: multiline ? 132 : mobileSizes.lg,
            borderRadius: mobileRadius.control,
            borderWidth: 1,
            borderColor: error ? palette.negative : palette.borderColor,
            backgroundColor: palette.surface,
            color: palette.color,
            paddingHorizontal: mobileSpacing[3],
            paddingVertical: multiline ? mobileSpacing[3] : mobileSpacing[2],
            opacity: props.editable === false ? 0.55 : 1,
            fontSize: 16,
            lineHeight: 24,
          },
          style,
        ]}
      />
    </FormField>
  );
}
