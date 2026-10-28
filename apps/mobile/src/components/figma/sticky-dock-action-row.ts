import { designTokens } from '@bidplace/design-tokens';

export function stickyDockActionRowStyle() {
  const dock = designTokens.stickyDock;
  return {
    height: dock.actionHeight,
    paddingTop: dock.controlTop,
    paddingBottom: dock.actionHeight - dock.controlTop - dock.controlSize,
    paddingHorizontal: dock.controlInset,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: 'transparent',
    zIndex: designTokens.layer.chrome,
    pointerEvents: 'box-none' as const,
  };
}

export function stickyDockTabsStyle() {
  return {
    position: 'sticky' as const,
    top: designTokens.stickyDock.actionHeight,
    zIndex: designTokens.layer.chrome,
  };
}
