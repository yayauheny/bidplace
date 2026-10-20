import { designTokens, type SemanticColorMap } from '@bidplace/design-tokens';

import { appDialogSheetBottomSpace } from '../ui/app-dialog-host-style';

export function filterSheetPanelStyle(
  compact = false,
  viewportHeight: number | undefined = undefined,
  bottomInset = 0,
  palette: SemanticColorMap,
) {
  return {
    width: '100%' as const,
    ...(compact
      ? { borderTopLeftRadius: 32, borderTopRightRadius: 32 }
      : { height: (viewportHeight ?? '100%') as number | '100%' }),
    paddingHorizontal: compact ? 20 : designTokens.layout.gutter,
    paddingTop: compact ? 8 : designTokens.space.x5,
    paddingBottom: compact
      ? 0
      : appDialogSheetBottomSpace(designTokens.space.x5, bottomInset),
    backgroundColor: palette.canvas,
  };
}

export function filterSheetHeaderStyle() {
  return {
    width: '100%' as const,
    minHeight: designTokens.size.touch,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.space.x1,
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
    minHeight: designTokens.size.input,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: designTokens.space.identityGap,
    paddingBottom: designTokens.space.x3,
  };
}
