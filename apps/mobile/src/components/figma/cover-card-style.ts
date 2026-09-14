import { Platform, type ViewStyle } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

export const coverArtworkScale = 1.05;

export type CoverCardFrameSize = {
  width: number;
  height: number;
};

export function coverCardFrameStyle(
  kind: 'work' | 'author',
  size?: CoverCardFrameSize,
): ViewStyle {
  return {
    width: size?.width ?? '100%',
    ...(size
      ? { height: size.height }
      : {
          aspectRatio: figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
        }),
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

// Overlay zone: hugs its text; `CoverFrost` fills it absolutely.
export function coverFrostZoneStyle(): ViewStyle {
  return {
    alignSelf: 'stretch',
    position: 'relative',
  };
}

// Figma `874:5541`: 20/12/12 padding around the 24px name = 56 total.
export function authorCoverNameZoneStyle(): ViewStyle {
  return {
    paddingTop: figmaTokens.space.x5,
    paddingBottom: figmaTokens.space.coverPad,
    paddingHorizontal: figmaTokens.space.coverPad,
    alignItems: 'center',
  };
}

export function coverOverlayPadStyle(): ViewStyle {
  return {
    padding: figmaTokens.space.coverPad,
    gap: figmaTokens.space.coverGap,
  };
}
