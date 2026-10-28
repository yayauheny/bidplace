import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export type FigmaChoiceChipInteraction =
  | 'idle'
  | 'hover'
  | 'pressed'
  | 'disabled';

export function figmaChoiceChipStyle(
  selected: boolean,
  interaction: FigmaChoiceChipInteraction,
  removable = false,
  palette: SemanticColorMap,
) {
  const active = interaction === 'hover' || interaction === 'pressed';

  return {
    height: removable ? designTokens.size.choiceChipRemovable : undefined,
    minHeight: removable
      ? designTokens.size.choiceChipRemovable
      : designTokens.size.choiceChip,
    paddingHorizontal: removable
      ? designTokens.space.choiceChipRemovableX
      : designTokens.space.choiceChipX,
    paddingVertical: removable ? 0 : designTokens.space.choiceChipY,
    borderRadius: designTokens.radius.button,
    borderWidth: removable ? 0.5 : 1,
    borderColor: selected ? palette.ink : palette.white,
    backgroundColor: selected
      ? active
        ? palette.solidHover
        : palette.solid
      : active
        ? palette.mutedHover
        : palette.mutedFill,
    opacity: interaction === 'disabled' ? designTokens.opacity.disabled : 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export function figmaChoiceChipTextColor(
  selected: boolean,
  palette: SemanticColorMap,
) {
  return selected ? palette.white : palette.ink;
}
