import { figmaTokens } from '@bidplace/design-tokens';

export const figmaButtonVariants = [
  'solid',
  'outline',
  'quiet',
  'ghost',
  'muted',
  'danger',
  'authPrimary',
  'authQuiet',
  'authProvider',
  'authSuggestion',
] as const;

export const figmaButtonSizes = [
  'regular',
  'large',
  'compact',
  'auth',
  'authResend',
  'authSuggestion',
] as const;

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
  const insetPressedSurface =
    pressed && (variant === 'ghost' || variant === 'muted');
  const compact = size === 'compact';
  const authHeight =
    size === 'auth'
      ? figmaTokens.auth.actionHeight
      : size === 'authResend'
        ? figmaTokens.auth.resendHeight
        : size === 'authSuggestion'
          ? figmaTokens.auth.suggestionHeight
        : null;

  return {
    ...(compact
      ? {}
      : {
          minHeight:
            (authHeight ??
              (size === 'large'
                ? figmaTokens.size.buttonLarge
                : figmaTokens.size.button)) - (insetPressedSurface ? 2 : 0),
        }),
    margin: insetPressedSurface ? 1 : 0,
    paddingHorizontal:
      size === 'authSuggestion'
        ? figmaTokens.auth.suggestionX
        : compact
          ? figmaTokens.space.quietButtonX
          : figmaTokens.space.buttonX,
    paddingVertical:
      size === 'authSuggestion'
        ? figmaTokens.auth.suggestionY
        : compact
          ? figmaTokens.space.quietButtonY
          : figmaTokens.space.buttonY,
    borderRadius: figmaButtonRadius(size),
    borderWidth:
      compact ||
      insetPressedSurface ||
      variant === 'authPrimary' ||
      variant === 'authProvider' ||
      variant === 'authSuggestion'
        ? 0
        : authHeight
          ? 0.5
          : 1,
    borderColor:
      variant === 'authPrimary' || variant === 'authProvider'
        ? 'transparent'
        : buttonBorder(variant),
    backgroundColor:
      variant === 'outline'
        ? 'transparent'
        : disabled && (variant === 'solid' || variant === 'danger')
          ? variant === 'danger'
            ? figmaTokens.color.danger
            : figmaTokens.color.solidDisabled
          : fill,
    opacity: disabled ? 0.5 : 1,
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
  return (
    variant === 'outline' ||
    variant === 'quiet' ||
    variant === 'authProvider' ||
    variant === 'authPrimary' ||
    variant === 'authSuggestion'
  );
}

export function figmaButtonGradientPlacement(variant: FigmaButtonVariant) {
  if (variant === 'quiet') return 'outside' as const;
  if (
    variant === 'outline' ||
    variant === 'authProvider' ||
    variant === 'authPrimary' ||
    variant === 'authSuggestion'
  ) {
    return 'inset' as const;
  }
  return 'none' as const;
}

export function figmaButtonUsesOutsidePaintWrapper(
  variant: FigmaButtonVariant,
) {
  return figmaButtonGradientPlacement(variant) === 'outside';
}

export function figmaButtonGradientColors(variant: FigmaButtonVariant) {
  if (variant === 'authPrimary') {
    return [
      figmaTokens.auth.primaryBorderStart,
      figmaTokens.auth.primaryBorderEnd,
    ] as const;
  }
  if (variant === 'authProvider' || variant === 'authSuggestion') {
    return [
      variant === 'authSuggestion'
        ? figmaTokens.auth.suggestionBorderStart
        : figmaTokens.auth.providerBorderStart,
      variant === 'authSuggestion'
        ? figmaTokens.auth.suggestionBorderEnd
        : figmaTokens.auth.providerBorderEnd,
    ] as const;
  }
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

export function figmaButtonInsetBorderWidth(variant: FigmaButtonVariant) {
  if (variant === 'authPrimary') return figmaTokens.auth.primaryBorderWidth;
  if (
    variant === 'authProvider' ||
    variant === 'authSuggestion' ||
    variant === 'outline'
  ) return 1;
  return 0;
}

export function figmaAuthActionVariant(
  size: FigmaButtonSize | undefined,
  role: 'primary' | 'secondary',
): FigmaButtonVariant {
  if (role === 'primary' && size === 'auth') return 'authPrimary';
  if (role === 'secondary' && size === 'authResend') return 'authQuiet';
  return role === 'primary' ? 'solid' : 'outline';
}

export function figmaButtonLabelColor(variant: FigmaButtonVariant) {
  if (variant === 'authQuiet' || variant === 'authProvider') {
    return figmaTokens.color.textSubdued;
  }
  return variant === 'solid' || variant === 'danger' || variant === 'authPrimary'
    ? figmaTokens.color.white
    : figmaTokens.color.ink;
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
    case 'authPrimary':
      return active ? figmaTokens.color.solidHover : figmaTokens.color.fieldValue;
    case 'authQuiet':
    case 'authProvider':
    case 'authSuggestion':
      return active ? figmaTokens.color.ghostHover : figmaTokens.color.canvas;
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
    case 'authPrimary':
      return 'transparent';
    case 'authQuiet':
      return figmaTokens.color.canvas;
    case 'authProvider':
    case 'authSuggestion':
      return 'transparent';
  }
}
