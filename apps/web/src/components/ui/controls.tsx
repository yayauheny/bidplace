import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  FocusEvent,
  FocusEventHandler,
  MouseEventHandler,
  ReactElement,
  ReactNode,
} from 'react';
import { cloneElement, forwardRef, isValidElement, useId, useState } from 'react';

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

type ChildControlProps = {
  style?: CSSProperties | undefined;
  tabIndex?: number | undefined;
  onClick?: MouseEventHandler<HTMLElement> | undefined;
  onFocus?: FocusEventHandler<HTMLElement> | undefined;
  onBlur?: FocusEventHandler<HTMLElement> | undefined;
  'aria-label'?: string | undefined;
  'aria-disabled'?: boolean | undefined;
};

type A11yFieldState = {
  controlId: string;
  descriptionId?: string | undefined;
  errorId?: string | undefined;
  describedBy?: string | undefined;
};

function composeHandlers<T extends HTMLElement>(
  first?: FocusEventHandler<T>,
  second?: FocusEventHandler<T>,
) {
  return (event: FocusEvent<T>) => {
    first?.(event);
    second?.(event);
  };
}

function useFocusableStyle() {
  const [focused, setFocused] = useState(false);

  return {
    focusStyle: {
      outline: focused ? '2px solid var(--focusRing)' : '2px solid transparent',
      outlineOffset: 2,
    },
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
}

function useFieldA11y(
  id: string | undefined,
  description: string | undefined,
  error: string | undefined,
): A11yFieldState {
  const generatedId = useId();
  const controlId = id ?? generatedId;

  return {
    controlId,
    descriptionId: description ? `${controlId}-description` : undefined,
    errorId: error ? `${controlId}-error` : undefined,
    describedBy:
      description || error
        ? [description ? `${controlId}-description` : undefined, error ? `${controlId}-error` : undefined]
            .filter(Boolean)
            .join(' ')
        : undefined,
  };
}

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
  const disabledState = disabled || isLoading;
  const { focusStyle, onFocus, onBlur } = useFocusableStyle();
  const buttonProps = props as ComponentPropsWithoutRef<'button'>;
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
    opacity: disabledState ? 0.55 : 1,
    transition: 'opacity 120ms ease, border-color 120ms ease, outline-color 120ms ease',
    ...toneStyles,
    ...style,
    ...focusStyle,
  } as const;

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<ChildControlProps>;

    return cloneElement(child, {
      'aria-label': accessibilityLabel,
      'aria-disabled': disabledState || undefined,
      tabIndex: disabledState ? -1 : child.props.tabIndex,
      onClick: (event) => {
        if (disabledState) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        child.props.onClick?.(event);
      },
      onFocus: composeHandlers(child.props.onFocus, onFocus),
      onBlur: composeHandlers(child.props.onBlur, onBlur),
      style: {
        ...(child.props as { style?: Record<string, unknown> }).style,
        ...buttonStyle,
      },
    });
  }

  return (
    <button
      {...buttonProps}
      onClick={onPress}
      onFocus={composeHandlers(buttonProps.onFocus as FocusEventHandler<HTMLButtonElement> | undefined, onFocus)}
      onBlur={composeHandlers(buttonProps.onBlur as FocusEventHandler<HTMLButtonElement> | undefined, onBlur)}
      aria-label={accessibilityLabel}
      disabled={disabledState}
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
  descriptionId?: string | undefined;
  errorId?: string | undefined;
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  descriptionId,
  errorId,
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
        <Text id={descriptionId} size="caption" tone="muted">
          {description}
        </Text>
      ) : null}
      {error ? (
        <Text id={errorId} size="caption" tone="danger" role="alert" aria-live="polite">
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
  const { controlId, descriptionId, errorId, describedBy } = useFieldA11y(id, description, error);
  const { focusStyle, onFocus, onBlur } = useFocusableStyle();
  const inputProps = props as ComponentPropsWithoutRef<'input'>;

  return (
    <FormField
      label={label}
      htmlFor={controlId}
      description={description}
      error={error}
      descriptionId={descriptionId}
      errorId={errorId}
    >
      <input
        {...inputProps}
        id={controlId}
        ref={ref}
        aria-describedby={describedBy}
        aria-invalid={error ? true : inputProps['aria-invalid']}
        onFocus={composeHandlers(inputProps.onFocus as FocusEventHandler<HTMLInputElement> | undefined, onFocus)}
        onBlur={composeHandlers(inputProps.onBlur as FocusEventHandler<HTMLInputElement> | undefined, onBlur)}
        style={{
          ...baseFieldStyle,
          ...(style ?? {}),
          ...focusStyle,
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
    const { controlId, descriptionId, errorId, describedBy } = useFieldA11y(id, description, error);
    const { focusStyle, onFocus, onBlur } = useFocusableStyle();
    const textAreaProps = props as ComponentPropsWithoutRef<'textarea'>;

    return (
      <FormField
        label={label}
        htmlFor={controlId}
        description={description}
        error={error}
        descriptionId={descriptionId}
        errorId={errorId}
      >
        <textarea
          {...textAreaProps}
          id={controlId}
          ref={ref}
          aria-describedby={describedBy}
          aria-invalid={error ? true : textAreaProps['aria-invalid']}
          onFocus={composeHandlers(textAreaProps.onFocus as FocusEventHandler<HTMLTextAreaElement> | undefined, onFocus)}
          onBlur={composeHandlers(textAreaProps.onBlur as FocusEventHandler<HTMLTextAreaElement> | undefined, onBlur)}
          style={{
            ...baseFieldStyle,
            minHeight: 136,
            resize: 'vertical',
            ...(style ?? {}),
            ...focusStyle,
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
    const { focusStyle, onFocus, onBlur } = useFocusableStyle();
    const selectProps = props as ComponentPropsWithoutRef<'select'>;

    return (
      <select
        ref={ref}
        {...selectProps}
        onFocus={composeHandlers(selectProps.onFocus as FocusEventHandler<HTMLSelectElement> | undefined, onFocus)}
        onBlur={composeHandlers(selectProps.onBlur as FocusEventHandler<HTMLSelectElement> | undefined, onBlur)}
        style={{ ...selectStyle, ...(selectProps.style ?? {}), ...focusStyle }}
      />
    );
  },
);

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, description, error, children, id, ...props },
  ref,
) {
  const { controlId, descriptionId, errorId, describedBy } = useFieldA11y(id, description, error);

  return (
    <FormField
      label={label}
      htmlFor={controlId}
      description={description}
      error={error}
      descriptionId={descriptionId}
      errorId={errorId}
    >
      <NativeSelect
        id={controlId}
        ref={ref}
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : props['aria-invalid']}
      >
        {children}
      </NativeSelect>
    </FormField>
  );
});
