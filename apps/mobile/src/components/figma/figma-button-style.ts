import { figmaTokens } from '@bidplace/design-tokens';

export const figmaButtonVariants = [
  'solid',
  'outline',
  'quiet',
  'ghost',
  'muted',
  'danger',
] as const;

export const figmaButtonSizes = ['regular', 'large', 'compact'] as const;

export type FigmaButtonVariant = (typeof figmaButtonVariants)[number];
export type FigmaButtonSize = (typeof figmaButtonSizes)[number];
export type FigmaButtonInteraction = 'idle' | 'hover' | 'pressed' | 'disabled';

export function figmaButtonStyle(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
  size: FigmaButtonSize = 'regular',
) {
  const disabled = interaction === 'disabled';
  const hovered = interaction === 'hover';
  const pressed = interaction === 'pressed';
  const fill = buttonFill(variant, hovered || pressed);
  const showRing = pressed;
  const insetPressedSurface =
    pressed && (variant === 'ghost' || variant === 'muted');
  const compact = size === 'compact';

  return {
    ...(compact
      ? {}
      : {
          minHeight:
            (size === 'large'
              ? figmaTokens.size.buttonLarge
              : figmaTokens.size.button) - (insetPressedSurface ? 2 : 0),
        }),
    margin: insetPressedSurface ? 1 : 0,
    paddingHorizontal: compact
      ? figmaTokens.space.quietButtonX
      : figmaTokens.space.buttonX,
    paddingVertical: compact
      ? figmaTokens.space.quietButtonY
      : figmaTokens.space.buttonY,
    borderRadius: figmaButtonRadius(size),
    borderWidth: compact || insetPressedSurface ? 0 : 1,
    borderColor: buttonBorder(variant),
    backgroundColor:
      variant === 'outline' || variant === 'quiet'
        ? 'transparent'
        : disabled && (variant === 'solid' || variant === 'danger')
          ? variant === 'danger'
            ? figmaTokens.color.danger
            : figmaTokens.color.solidDisabled
          : fill,
    opacity: disabled ? 0.5 : 1,
    boxShadow: showRing
      ? `0px 0px 0px 2px ${figmaTokens.color.pressRing}`
      : undefined,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };
}

export function figmaButtonRadius(size: FigmaButtonSize) {
  return size === 'compact'
    ? figmaTokens.radius.chip
    : figmaTokens.radius.button;
}

export function figmaButtonSurfaceFill(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  const active = interaction === 'hover' || interaction === 'pressed';
  if (interaction === 'disabled' && variant === 'solid') {
    return figmaTokens.color.solidDisabled;
  }
  if (interaction === 'disabled' && variant === 'danger') {
    return figmaTokens.color.danger;
  }
  return buttonFill(variant, active);
}

export function figmaButtonUsesGradientBorder(variant: FigmaButtonVariant) {
  return variant === 'outline' || variant === 'quiet';
}

export function figmaButtonGradientColors(variant: FigmaButtonVariant) {
  if (variant === 'quiet') {
    return [
      figmaTokens.color.quietBorderStart,
      figmaTokens.color.quietBorderEnd,
    ] as const;
  }
  return [figmaTokens.color.ink, '#585858'] as const;
}

export function figmaButtonGradientOpacity(variant: FigmaButtonVariant) {
  return variant === 'quiet' ? figmaTokens.opacity.quietBorder : 1;
}

export function figmaButtonLabelColor(variant: FigmaButtonVariant) {
  return variant === 'solid' || variant === 'danger'
    ? figmaTokens.color.white
    : figmaTokens.color.ink;
}

export function figmaButtonLabelTypography(size: FigmaButtonSize) {
  return size === 'compact'
    ? figmaTokens.typography.buttonCompact
    : figmaTokens.typography.button;
}

function buttonFill(variant: FigmaButtonVariant, active: boolean) {
  switch (variant) {
    case 'solid':
      return active ? figmaTokens.color.solidHover : figmaTokens.color.solid;
    case 'danger':
      return active ? figmaTokens.color.dangerHover : figmaTokens.color.danger;
    case 'outline':
    case 'ghost':
      return active ? figmaTokens.color.ghostHover : figmaTokens.color.canvas;
    case 'quiet':
      return figmaTokens.color.quietFill;
    case 'muted':
      return active
        ? figmaTokens.color.mutedHover
        : figmaTokens.color.mutedFill;
  }
}

function buttonBorder(variant: FigmaButtonVariant) {
  switch (variant) {
    case 'solid':
      return figmaTokens.color.ink;
    case 'danger':
      return figmaTokens.color.dangerHover;
    case 'outline':
    case 'quiet':
      return 'transparent';
    case 'ghost':
    case 'muted':
      return figmaTokens.color.canvas;
  }
}
