import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

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
  palette: SemanticColorMap,
) {
  const password =
    metrics === 'authPassword' || metrics === 'authScreenPassword';
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
        : {
            height: designTokens.size.input,
            minHeight: designTokens.size.input,
          }),
    paddingHorizontal: designTokens.space.fieldX,
    paddingVertical: password ? 0 : designTokens.space.fieldY,
    borderRadius: designTokens.radius.field,
    borderWidth:
      metrics === 'authScreenPassword'
        ? designTokens.auth.passwordBorder
        : designTokens.size.fieldBorder,
    borderColor: fieldBorder(status, variant, palette),
    backgroundColor: fieldFill(status, palette),
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

export function figmaFieldValueColor(
  status: FigmaFieldStatus,
  palette: SemanticColorMap,
) {
  if (status === 'empty' || status === 'hoverEmpty') {
    return palette.muted;
  }
  return palette.fieldValue;
}

/** Placeholder text is drawn only while the label is not floating, i.e. for `empty`. */
export function figmaFieldPlaceholderColor(
  status: FigmaFieldStatus,
  variant: FigmaFieldVariant = 'default',
  palette: SemanticColorMap,
) {
  return variant === 'authorApplication' && status === 'empty'
    ? palette.authorApplicationField
    : palette.muted;
}

function fieldBorder(
  status: FigmaFieldStatus,
  variant: FigmaFieldVariant,
  palette: SemanticColorMap,
) {
  switch (status) {
    case 'empty':
      return variant === 'authorApplication'
        ? palette.authorApplicationField
        : palette.muted;
    case 'disabled':
      return palette.muted;
    case 'hoverEmpty':
      return palette.fieldHoverBorder;
    case 'filled':
      return palette.ink;
    case 'hoverFilled':
      return palette.solidHover;
    case 'focus':
      return palette.focus;
    case 'error':
      return palette.error;
    case 'success':
      return palette.success;
  }
}

function fieldFill(status: FigmaFieldStatus, palette: SemanticColorMap) {
  switch (status) {
    case 'disabled':
      return palette.mutedFill;
    case 'hoverEmpty':
    case 'hoverFilled':
      return palette.fieldHoverFill;
    default:
      return palette.canvas;
  }
}
