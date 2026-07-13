import type { ComponentPropsWithoutRef } from 'react';
import { useId } from 'react';

import { mobileRadius, mobileSpacing, mobileSizes } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { FormField } from './FormField';
import { Input } from 'tamagui';

type AppInputProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  id?: string;
  editable?: boolean;
} & ComponentPropsWithoutRef<typeof Input>;

export function AppInput({
  label,
  description,
  error,
  required,
  id,
  ...props
}: AppInputProps) {
  const generatedId = useId();
  const palette = useAppThemePalette();
  const controlId = id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

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
      <Input
        id={controlId}
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        placeholderTextColor="$textMuted"
        style={{
          height: mobileSizes.lg,
          borderRadius: mobileRadius.md,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.surface,
          color: palette.text,
          paddingHorizontal: mobileSpacing[3],
          opacity: props.editable === false ? 0.6 : 1,
        }}
        focusStyle={{
          borderColor: '$focusRing',
        }}
        {...props}
      />
    </FormField>
  );
}
