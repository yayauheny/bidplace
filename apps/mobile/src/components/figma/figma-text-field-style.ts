import { designTokens } from '@bidplace/design-tokens';

export type FigmaFieldStatus =
  | 'empty'
  | 'hoverEmpty'
  | 'filled'
  | 'hoverFilled'
  | 'focus'
  | 'error'
  | 'success'
  | 'disabled';

export function figmaFieldStatus({
  disabled,
  error,
  success,
  focused,
  hovered,
  filled,
}: {
  disabled: boolean;
  error: boolean;
  success: boolean;
  focused: boolean;
  hovered: boolean;
  filled: boolean;
}): FigmaFieldStatus {
  if (disabled) return 'disabled';
  if (error) return 'error';
  if (success) return 'success';
  if (focused) return 'focus';
  if (filled) return hovered ? 'hoverFilled' : 'filled';
  return hovered ? 'hoverEmpty' : 'empty';
}

export function figmaFieldShowsFloatingLabel(status: FigmaFieldStatus) {
  return status !== 'empty' && status !== 'disabled';
}

/** `authorApplication` lightens only the empty border and placeholder; every other state is shared. */
export type FigmaFieldVariant = 'default' | 'authorApplication';

export function figmaFieldStyle(
  status: FigmaFieldStatus,
  multiline = false,
  metrics: 'default' | 'authPassword' | 'authScreenPassword' = 'default',
  variant: FigmaFieldVariant = 'default',
) {
  const password = metrics === 'authPassword' || metrics === 'authScreenPassword';
  const passwordHeight =
    metrics === 'authScreenPassword'
      ? designTokens.auth.screenPasswordHeight
      : designTokens.auth.passwordHeight;
  return {
    width: '100%' as const,
    // A single-line shell has a fixed outer height. At devicePixelRatio 1 the
    // 0.5 border paints as 1px; minHeight alone then lets padding and the
    // line box grow the border box. Multiline fields keep only minHeight.
    ...(multiline
      ? { minHeight: designTokens.size.input }
      : password
        ? { height: passwordHeight, minHeight: passwordHeight }
        : { height: designTokens.size.input, minHeight: designTokens.size.input }),
    paddingHorizontal: designTokens.space.fieldX,
    paddingVertical: password ? 0 : designTokens.space.fieldY,
    borderRadius: designTokens.radius.field,
    borderWidth:
      metrics === 'authScreenPassword'
        ? designTokens.auth.passwordBorder
        : designTokens.size.fieldBorder,
    borderColor: fieldBorder(status, variant),
    backgroundColor: fieldFill(status),
    flexDirection: 'row' as const,
    alignItems: multiline ? ('flex-start' as const) : ('center' as const),
    gap: designTokens.space.fieldGap,
  };
}

/** The field shell draws focus, error, and disabled borders. The native control must not add a second ring. */
export const figmaFieldNativeOutlineStyle = {
  outlineStyle: 'none' as const,
  outlineWidth: 0,
};

export function figmaFieldValueColor(status: FigmaFieldStatus) {
  if (status === 'empty' || status === 'hoverEmpty') {
    return designTokens.color.muted;
  }
  return designTokens.color.fieldValue;
}

/** Placeholder text is drawn only while the label is not floating, i.e. for `empty`. */
export function figmaFieldPlaceholderColor(
  status: FigmaFieldStatus,
  variant: FigmaFieldVariant = 'default',
) {
  return variant === 'authorApplication' && status === 'empty'
    ? designTokens.color.authorApplicationField
    : designTokens.color.muted;
}

function fieldBorder(status: FigmaFieldStatus, variant: FigmaFieldVariant) {
  switch (status) {
    case 'empty':
      return variant === 'authorApplication'
        ? designTokens.color.authorApplicationField
        : designTokens.color.muted;
    case 'disabled':
      return designTokens.color.muted;
    case 'hoverEmpty':
      return designTokens.color.fieldHoverBorder;
    case 'filled':
      return designTokens.color.ink;
    case 'hoverFilled':
      return designTokens.color.solidHover;
    case 'focus':
      return designTokens.color.focus;
    case 'error':
      return designTokens.color.error;
    case 'success':
      return designTokens.color.success;
  }
}

function fieldFill(status: FigmaFieldStatus) {
  switch (status) {
    case 'disabled':
      return designTokens.color.mutedFill;
    case 'hoverEmpty':
    case 'hoverFilled':
      return designTokens.color.fieldHoverFill;
    default:
      return designTokens.color.canvas;
  }
}
