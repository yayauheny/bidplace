import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import { cloneElement, forwardRef, isValidElement, useId } from 'react';

import { radius, spacing, typography } from '../../theme/tokens';
import { Text } from './layout';
import { YStack } from './stack';

type AppButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  isLoading?: boolean | undefined;
  loadingLabel?: string | undefined;
  children: ReactNode;
  tone?: 'primary' | 'secondary' | 'subtle';
  asChild?: boolean | undefined;
  onPress?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  accessibilityLabel?: string | undefined;
  size?: string | undefined;
};

function ButtonContent({
  isLoading,
  loadingLabel,
  children,
}: Pick<AppButtonProps, 'isLoading' | 'loadingLabel' | 'children'>) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      <span aria-hidden="true">⏳</span>
      <Text size="small" weight="strong">
        {loadingLabel ?? 'Сохранение'}
      </Text>
    </>
  );
}

function AppButton({
  tone = 'primary',
  isLoading,
  loadingLabel,
  disabled,
  children,
  asChild,
  onPress,
  accessibilityLabel,
  size,
  style,
  ...props
}: AppButtonProps) {
  void size;
  const toneStyles =
    tone === 'secondary'
      ? {
          backgroundColor: 'var(--surface)',
          color: 'var(--color)',
          borderColor: 'var(--borderColor)',
        }
      : tone === 'subtle'
        ? {
            backgroundColor: 'var(--backgroundMuted)',
            color: 'var(--color)',
            borderColor: 'var(--borderColor)',
          }
        : {
            backgroundColor: 'var(--accent)',
            color: '#fff',
            borderColor: 'var(--accent)',
          };

  const content = (
    <ButtonContent isLoading={isLoading} loadingLabel={loadingLabel}>
      {children}
    </ButtonContent>
  );

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    minHeight: 44,
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    fontSize: typography.bodyStrong.size,
    lineHeight: `${typography.bodyStrong.lineHeight}px`,
    fontWeight: 600,
    cursor: 'pointer',
    opacity: disabled || isLoading ? 0.55 : 1,
    transition: 'opacity 120ms ease, border-color 120ms ease',
    ...toneStyles,
    ...style,
  } as const;

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement, {
      'aria-label': accessibilityLabel,
      style: {
        ...(children.props as { style?: Record<string, unknown> }).style,
        ...buttonStyle,
      },
    });
  }

  return (
    <button
      {...props}
      onClick={onPress}
      aria-label={accessibilityLabel}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      style={buttonStyle}
    >
      {content}
    </button>
  );
}

export function PrimaryButton(props: AppButtonProps) {
  return <AppButton {...props} tone="primary" />;
}

export function SecondaryButton(props: AppButtonProps) {
  return <AppButton {...props} tone="secondary" />;
}

type FieldProps = {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  htmlFor?: string | undefined;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  children,
}: FieldProps) {
  return (
    <YStack gap={spacing[1]}>
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: typography.small.size,
          lineHeight: `${typography.small.lineHeight}px`,
          fontWeight: 600,
          color: 'var(--color)',
        }}
      >
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {description ? (
        <Text size="caption" tone="muted">
          {description}
        </Text>
      ) : null}
      {error ? (
        <Text size="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}

type BaseInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'children'> & {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
};

const baseFieldStyle = {
  borderRadius: radius.md,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--borderColor)',
  backgroundColor: 'var(--surface)',
  color: 'var(--color)',
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  fontSize: typography.body.size,
  lineHeight: `${typography.body.lineHeight}px`,
  minHeight: 44,
  outline: 'none',
} as const;

export const TextField = forwardRef<HTMLInputElement, BaseInputProps>(function TextField(
  { label, description, error, style, id, ...props },
  ref,
) {
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <FormField label={label} htmlFor={controlId} description={description} error={error}>
      <input
        {...props}
        id={controlId}
        ref={ref}
        style={{
          ...baseFieldStyle,
          ...(style ?? {}),
        }}
      />
    </FormField>
  );
});

type TextAreaFieldProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'children'> & {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, description, error, style, id, ...props }, ref) {
    const generatedId = useId();
    const controlId = id ?? generatedId;

    return (
      <FormField label={label} htmlFor={controlId} description={description} error={error}>
        <textarea
          {...props}
          id={controlId}
          ref={ref}
          style={{
            ...baseFieldStyle,
            minHeight: 136,
            resize: 'vertical',
            ...(style ?? {}),
          }}
        />
      </FormField>
    );
  },
);

type SelectFieldProps = Omit<ComponentPropsWithoutRef<'select'>, 'children'> & {
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
};

const selectStyle = {
  ...baseFieldStyle,
  appearance: 'none',
} as const;

export const NativeSelect = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<'select'>>(
  function NativeSelect(props, ref) {
    return <select ref={ref} {...props} style={{ ...selectStyle, ...(props.style ?? {}) }} />;
  },
);

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, description, error, children, id, ...props },
  ref,
) {
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return (
    <FormField label={label} htmlFor={controlId} description={description} error={error}>
      <NativeSelect id={controlId} ref={ref} {...props}>
        {children}
      </NativeSelect>
    </FormField>
  );
});
