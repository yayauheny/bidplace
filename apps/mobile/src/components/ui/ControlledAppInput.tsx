import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { AppInput, type AppInputProps } from './AppInput';

type ControlledAppInputProps<TFieldValues extends FieldValues> = Omit<
  AppInputProps,
  'error' | 'onBlur' | 'onChange' | 'onChangeText' | 'value'
> & {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  error?: string;
  formatValue?: (value: unknown) => string;
  parseValue?: (value: string) => unknown;
};

function formatDefaultValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function ControlledAppInput<TFieldValues extends FieldValues>({
  control,
  name,
  error,
  formatValue = formatDefaultValue,
  parseValue = (value) => value,
  ...inputProps
}: ControlledAppInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <AppInput
          {...inputProps}
          value={formatValue(field.value)}
          onBlur={field.onBlur}
          onChangeText={(value) => field.onChange(parseValue(value))}
          error={error}
        />
      )}
    />
  );
}
