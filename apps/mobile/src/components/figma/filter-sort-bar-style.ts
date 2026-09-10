import { figmaTokens } from '@bidplace/design-tokens';

export const FILTER_TRIGGER_RADIUS = 14;
export const FILTER_TRIGGER_BLUR = 12;

export function filterTriggerStyle(active: boolean) {
  return {
    minHeight: 42,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.x2,
    paddingLeft: figmaTokens.space.x2,
    paddingRight: figmaTokens.space.x4,
    paddingVertical: figmaTokens.space.x2,
    borderRadius: FILTER_TRIGGER_RADIUS,
    borderWidth: 0.5,
    borderColor: active ? figmaTokens.color.ink : figmaTokens.color.divider,
    backgroundColor: figmaTokens.color.glassStrong,
  };
}

export function filterSortBarStyle() {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.pageGutter,
  };
}

