import { Platform, type ViewStyle } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

export const coverArtworkScale = 1.05;

export function coverCardFrameStyle(kind: 'work' | 'author'): ViewStyle {
  return {
    width: '100%',
    aspectRatio: figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
    overflow: 'hidden',
    borderRadius:
      kind === 'author'
        ? figmaTokens.radius.authorCover
        : figmaTokens.radius.cover,
    backgroundColor: figmaTokens.color.mutedFill,
  };
}

export function coverArtworkFrameStyle(emphasized: boolean): ViewStyle {
  const webTransition =
    Platform.OS === 'web'
      ? ({
          transitionDuration: `${figmaTokens.motion.media}ms`,
          transitionProperty: 'transform',
          transitionTimingFunction: figmaTokens.motion.easing,
        } as ViewStyle)
      : undefined;

  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    transform: [{ scale: emphasized ? coverArtworkScale : 1 }],
    ...webTransition,
  };
}

export function coverChipRowStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: figmaTokens.space.chipGap,
    overflow: 'hidden',
  };
}

export function authorCoverNameZoneStyle(): ViewStyle {
  return {
    alignSelf: 'stretch',
    height: figmaTokens.size.authorTopFrostHeight,
    paddingTop: figmaTokens.space.x5,
    paddingBottom: figmaTokens.space.coverPad,
    paddingHorizontal: figmaTokens.space.coverPad,
    justifyContent: 'center',
    alignItems: 'center',
  };
}

export function coverOverlayPadStyle(): ViewStyle {
  return {
    padding: figmaTokens.space.coverPad,
    gap: figmaTokens.space.coverGap,
  };
}
