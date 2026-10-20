import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

export type FilterOptionMode = 'radio' | 'checkbox';

export function filterOptionRowStyle() {
  return {
    width: '100%' as const,
    minHeight: designTokens.size.filterOptionRow,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.space.authorIdentityGap,
    paddingVertical: designTokens.space.filterOptionY,
  };
}

export function filterOptionControlStyle(
  mode: FilterOptionMode,
  selected: boolean,
  palette: SemanticColorMap,
) {
  return {
    width: designTokens.size.filterOption,
    height: designTokens.size.filterOption,
    flexShrink: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: palette.ink,
    borderRadius:
      mode === 'radio'
        ? designTokens.radius.filterRadio
        : designTokens.radius.filterCheckbox,
    backgroundColor: selected ? palette.ink : 'transparent',
  };
}

export function filterOptionLabelStyle() {
  return {
    flex: 1,
    minWidth: 0,
    letterSpacing: -0.16,
  };
}
