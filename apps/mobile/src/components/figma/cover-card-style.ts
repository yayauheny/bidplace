import { figmaTokens } from '@bidplace/design-tokens';

export type CoverCardKind = 'work' | 'author';

export function coverCardBox(width: number) {
  return {
    width,
    height: (width * figmaTokens.size.coverHeight) / figmaTokens.size.coverWidth,
    aspectRatio: figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
  } as const;
}

export function coverCardSpec() {
  const master = coverCardBox(figmaTokens.size.coverWidth);
  const consumer = coverCardBox(figmaTokens.layout.cardWidth);

  return {
    sourceNodeIds: [
      '874:5458',
      '874:5473',
      '874:5487',
      '874:5512',
      '874:5526',
      '874:5616',
      '874:5631',
      '874:5659',
      '874:5671',
      '874:5685',
      '874:5540',
      '874:5564',
      '874:5576',
    ],
    masterWidth: master.width,
    masterHeight: master.height,
    consumerWidth: consumer.width,
    consumerHeight: consumer.height,
    aspectRatio: master.aspectRatio,
    contentFit: 'cover' as const,
    titleMaxLines: 2,
    nameMaxLines: 2,
    rowGap: figmaTokens.space.coverRowGap,
    blockGap: figmaTokens.space.coverBlockGap,
    chipGap: figmaTokens.space.chipGap,
    workRadius: figmaTokens.radius.cover,
    authorRadius: figmaTokens.radius.authorCover,
  } as const;
}

export function coverCardFrameStyle(kind: CoverCardKind) {
  const spec = coverCardSpec();

  return {
    width: '100%' as const,
    maxWidth: '100%' as const,
    minWidth: 0,
    alignSelf: 'stretch' as const,
    flexShrink: 0,
    aspectRatio: spec.aspectRatio,
    position: 'relative' as const,
    borderRadius: kind === 'work' ? spec.workRadius : spec.authorRadius,
    backgroundColor: figmaTokens.color.mutedFill,
    overflow: 'hidden' as const,
  };
}

export function coverCardPressableStyle(kind: CoverCardKind) {
  const spec = coverCardSpec();

  return {
    width: '100%' as const,
    overflow: 'hidden' as const,
    borderRadius: kind === 'work' ? spec.workRadius : spec.authorRadius,
  };
}

export function coverCardSurfaceStyle(kind: CoverCardKind) {
  return {
    width: '100%' as const,
    ...(kind === 'author'
      ? { justifyContent: 'space-between' as const }
      : {}),
  };
}

export function coverCardOverlayLayerStyle(kind: CoverCardKind) {
  return {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent:
      kind === 'author' ? ('space-between' as const) : ('flex-end' as const),
  };
}

export function coverCardFocusStyle(focused: boolean) {
  if (!focused) return null;

  return {
    outlineWidth: figmaTokens.focus.width,
    outlineOffset: figmaTokens.focus.offset,
    outlineColor: figmaTokens.color.focus,
    outlineStyle: 'solid' as const,
    outline: `${figmaTokens.focus.width}px solid ${figmaTokens.color.focus}`,
  };
}

export const coverCardMediaStyle = {
  width: '100%' as const,
  aspectRatio: figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
};

export function coverCardOverlayRowStyle() {
  return {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    gap: figmaTokens.space.coverRowGap,
  };
}

export function authorCoverNameVeilStyle() {
  return {
    alignSelf: 'stretch' as const,
    paddingTop: figmaTokens.space.x5,
    paddingBottom: figmaTokens.space.coverPad,
    paddingHorizontal: figmaTokens.space.coverPad,
  };
}

export function authorCoverTagRowStyle() {
  return {
    flexDirection: 'row' as const,
    flexWrap: 'nowrap' as const,
    gap: figmaTokens.space.chipGap,
    overflow: 'hidden' as const,
  };
}
