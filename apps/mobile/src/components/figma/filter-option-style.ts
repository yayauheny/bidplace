import { figmaTokens } from '@bidplace/design-tokens';

export type FilterOptionMode = 'radio' | 'checkbox';

export function filterOptionRowStyle() {
  return {
    width: '100%' as const,
    minHeight: figmaTokens.size.filterOptionRow,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.authorIdentityGap,
    paddingVertical: figmaTokens.space.filterOptionY,
  };
}

export function filterOptionControlStyle(
  mode: FilterOptionMode,
  selected: boolean,
) {
  return {
    width: figmaTokens.size.filterOption,
    height: figmaTokens.size.filterOption,
    flexShrink: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: figmaTokens.color.ink,
    borderRadius:
      mode === 'radio'
        ? figmaTokens.radius.filterRadio
        : figmaTokens.radius.filterCheckbox,
    backgroundColor: selected ? figmaTokens.color.ink : 'transparent',
  };
}

export function filterOptionLabelStyle() {
  return {
    flex: 1,
    minWidth: 0,
    letterSpacing: -0.16,
  };
}
