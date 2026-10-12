import { figmaTokens } from '@bidplace/design-tokens';

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
    height: removable ? figmaTokens.size.choiceChipRemovable : undefined,
    minHeight: removable
      ? figmaTokens.size.choiceChipRemovable
      : figmaTokens.size.choiceChip,
    paddingHorizontal: removable
      ? figmaTokens.space.choiceChipRemovableX
      : figmaTokens.space.choiceChipX,
    paddingVertical: removable ? 0 : figmaTokens.space.choiceChipY,
    borderRadius: figmaTokens.radius.button,
    borderWidth: removable ? 0.5 : 1,
    borderColor: selected ? figmaTokens.color.ink : figmaTokens.color.white,
    backgroundColor: selected
      ? active
        ? figmaTokens.color.solidHover
        : figmaTokens.color.solid
      : active
        ? figmaTokens.color.mutedHover
        : figmaTokens.color.mutedFill,
    opacity: interaction === 'disabled' ? figmaTokens.opacity.disabled : 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export function figmaChoiceChipTextColor(selected: boolean) {
  return selected ? figmaTokens.color.white : figmaTokens.color.ink;
}
