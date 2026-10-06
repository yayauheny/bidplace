import { figmaTokens } from '@bidplace/design-tokens';

export type FigmaChoiceChipInteraction =
  | 'idle'
  | 'hover'
  | 'pressed'
  | 'disabled';

export function figmaChoiceChipStyle(
  selected: boolean,
  interaction: FigmaChoiceChipInteraction,
) {
  const active = interaction === 'hover' || interaction === 'pressed';

  return {
    minHeight: figmaTokens.size.choiceChip,
    paddingHorizontal: figmaTokens.space.choiceChipX,
    paddingVertical: figmaTokens.space.choiceChipY,
    borderRadius: figmaTokens.radius.button,
    borderWidth: 1,
    borderColor: selected
      ? figmaTokens.color.ink
      : figmaTokens.color.white,
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
