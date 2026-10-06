import { figmaTokens } from '@bidplace/design-tokens';

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

export function figmaFieldStyle(
  status: FigmaFieldStatus,
  multiline = false,
) {
  return {
    width: '100%' as const,
    minHeight: figmaTokens.size.input,
    paddingHorizontal: figmaTokens.space.fieldX,
    paddingVertical: figmaTokens.space.fieldY,
    borderRadius: figmaTokens.radius.field,
    borderWidth: 1,
    borderColor: fieldBorder(status),
    backgroundColor: fieldFill(status),
    flexDirection: 'row' as const,
    alignItems: multiline ? ('flex-start' as const) : ('center' as const),
    gap: figmaTokens.space.fieldGap,
  };
}

/** The field shell draws focus, error, and disabled borders. The native control must not add a second ring. */
export const figmaFieldNativeOutlineStyle = {
  outlineStyle: 'none' as const,
  outlineWidth: 0,
};

export function figmaFieldValueColor(status: FigmaFieldStatus) {
  if (status === 'empty' || status === 'hoverEmpty') {
    return figmaTokens.color.muted;
  }
  return figmaTokens.color.ink;
}

function fieldBorder(status: FigmaFieldStatus) {
  switch (status) {
    case 'empty':
    case 'disabled':
      return figmaTokens.color.muted;
    case 'hoverEmpty':
      return figmaTokens.color.fieldHoverBorder;
    case 'filled':
      return figmaTokens.color.ink;
    case 'hoverFilled':
      return figmaTokens.color.solidHover;
    case 'focus':
      return figmaTokens.color.focus;
    case 'error':
      return figmaTokens.color.error;
    case 'success':
      return figmaTokens.color.success;
  }
}

function fieldFill(status: FigmaFieldStatus) {
  switch (status) {
    case 'disabled':
      return figmaTokens.color.mutedFill;
    case 'hoverEmpty':
    case 'hoverFilled':
      return figmaTokens.color.fieldHoverFill;
    default:
      return figmaTokens.color.canvas;
  }
}
