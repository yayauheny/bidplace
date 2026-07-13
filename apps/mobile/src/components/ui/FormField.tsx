import type { ReactNode } from 'react';

import { mobileSpacing } from '../../theme/tokens';
import { Label, Text, YStack } from 'tamagui';

type FormFieldProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  descriptionId?: string;
  errorId?: string;
  children: ReactNode;
};

export function FormField({
  label,
  description,
  error,
  required,
  htmlFor,
  descriptionId,
  errorId,
  children,
}: FormFieldProps) {
  return (
    <YStack gap={mobileSpacing[1]}>
      <Label
        htmlFor={htmlFor}
        fontSize={14}
        lineHeight={20}
        fontWeight="600"
        color="$text"
      >
        {label}
        {required ? ' *' : null}
      </Label>
      {children}
      {description ? (
        <Text id={descriptionId} fontSize={12} lineHeight={16} color="$textMuted">
          {description}
        </Text>
      ) : null}
      {error ? (
        <Text
          id={errorId}
          fontSize={12}
          lineHeight={16}
          color="$danger"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}
