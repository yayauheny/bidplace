import { figmaTokens } from '@bidplace/design-tokens';

import { appDialogSheetBottomSpace } from '../ui/app-dialog-host-style';

export function filterSheetPanelStyle(
  compact = false,
  viewportHeight?: number,
  bottomInset = 0,
) {
  return {
    width: '100%' as const,
    ...(compact
      ? { borderTopLeftRadius: 32, borderTopRightRadius: 32 }
      : { height: (viewportHeight ?? '100%') as number | '100%' }),
    paddingHorizontal: compact ? 20 : figmaTokens.layout.gutter,
    paddingTop: compact ? 8 : figmaTokens.space.x5,
    paddingBottom: compact
      ? 0
      : appDialogSheetBottomSpace(figmaTokens.space.x5, bottomInset),
    backgroundColor: figmaTokens.color.canvas,
  };
}

export function filterSheetHeaderStyle() {
  return {
    width: '100%' as const,
    minHeight: figmaTokens.size.touch,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.x1,
  };
}

export function filterSheetTitleStyle() {
  return {
    flex: 1,
    minWidth: 0,
  };
}

export function filterSheetSectionRowStyle() {
  return {
    width: '100%' as const,
    minHeight: figmaTokens.size.input,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: figmaTokens.space.identityGap,
    paddingBottom: figmaTokens.space.x3,
  };
}
