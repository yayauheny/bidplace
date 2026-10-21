import { designTokens } from '@bidplace/design-tokens';

export type FilterOptionMode = 'radio' | 'checkbox';

export function filterOptionRowStyle() {
  return {
    width: '100%' as const,
    minHeight: designTokens.size.filterOptionRow,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.space.x2,
    paddingVertical: designTokens.space.filterOptionY,
  };
}

export function filterOptionControlStyle() {
  return {
    width: designTokens.size.filterOption,
    height: designTokens.size.filterOption,
    flexShrink: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export function filterOptionLabelStyle() {
  return { flex: 1, minWidth: 0 };
}
