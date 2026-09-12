import { figmaTokens } from '@bidplace/design-tokens';

export const figmaButtonVariants = [
  'solid',
  'outline',
  'ghost',
  'muted',
] as const;

export type FigmaButtonVariant = (typeof figmaButtonVariants)[number];
export type FigmaButtonInteraction = 'idle' | 'hover' | 'pressed' | 'disabled';

export function figmaButtonStyle(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
  size: 'regular' | 'large' = 'regular',
) {
  const disabled = interaction === 'disabled';
  const hovered = interaction === 'hover';
  const pressed = interaction === 'pressed';
  const fill = buttonFill(variant, hovered || pressed);
  const showRing = pressed;
  const insetPressedSurface =
    pressed && (variant === 'ghost' || variant === 'muted');

  return {
    minHeight:
      (size === 'large'
        ? figmaTokens.size.buttonLarge
        : figmaTokens.size.button) - (insetPressedSurface ? 2 : 0),
    margin: insetPressedSurface ? 1 : 0,
    paddingHorizontal: figmaTokens.space.buttonX,
    paddingVertical: figmaTokens.space.buttonY,
    borderRadius: figmaTokens.radius.button,
    borderWidth: insetPressedSurface ? 0 : 1,
    borderColor: buttonBorder(variant),
    backgroundColor:
      variant === 'outline'
        ? 'transparent'
        : disabled && variant === 'solid'
          ? figmaTokens.color.solidDisabled
          : fill,
    opacity: disabled ? 0.5 : 1,
    boxShadow: showRing
      ? `0px 0px 0px 2px ${figmaTokens.color.pressRing}`
      : undefined,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };
}

export function figmaButtonSurfaceFill(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  const active = interaction === 'hover' || interaction === 'pressed';
  if (interaction === 'disabled' && variant === 'solid') {
    return figmaTokens.color.solidDisabled;
  }
  return buttonFill(variant, active);
}

export function figmaButtonUsesGradientBorder(variant: FigmaButtonVariant) {
  return variant === 'outline';
}

export function figmaButtonLabelColor(variant: FigmaButtonVariant) {
  return variant === 'solid' ? figmaTokens.color.white : figmaTokens.color.ink;
}

function buttonFill(variant: FigmaButtonVariant, active: boolean) {
  switch (variant) {
    case 'solid':
      return active ? figmaTokens.color.solidHover : figmaTokens.color.solid;
    case 'outline':
    case 'ghost':
      return active ? figmaTokens.color.ghostHover : figmaTokens.color.canvas;
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
    case 'outline':
      return 'transparent';
    case 'ghost':
    case 'muted':
      return figmaTokens.color.canvas;
  }
}
