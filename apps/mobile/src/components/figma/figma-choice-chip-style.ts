import { designTokens } from '@bidplace/design-tokens';

export type FigmaChoiceChipInteraction =
  | 'idle'
  | 'hover'
  | 'pressed'
  | 'disabled';

export function figmaChoiceChipStyle(
  selected: boolean,
  interaction: FigmaChoiceChipInteraction,
  removable = false,
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
    borderColor: selected ? designTokens.color.ink : designTokens.color.white,
    backgroundColor: selected
      ? active
        ? designTokens.color.solidHover
        : designTokens.color.solid
      : active
        ? designTokens.color.mutedHover
        : designTokens.color.mutedFill,
    opacity: interaction === 'disabled' ? designTokens.opacity.disabled : 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export function figmaChoiceChipTextColor(selected: boolean) {
  return selected ? designTokens.color.white : designTokens.color.ink;
}
