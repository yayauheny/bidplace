import { Platform, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

export const coverArtworkScale = 1.05;

export type CoverCardFrameSize = {
  width: number;
  height: number;
};

export function coverCardFrameStyle(
  kind: 'work' | 'author',
  size?: CoverCardFrameSize,
  frameRadius?: number,
): ViewStyle {
  return {
    width: size?.width ?? '100%',
    ...(size
      ? { height: size.height }
      : {
          aspectRatio: designTokens.size.coverWidth / designTokens.size.coverHeight,
        }),
    overflow: 'hidden',
    borderRadius:
      frameRadius ??
      (kind === 'author'
        ? designTokens.radius.authorCover
        : designTokens.radius.cover),
    backgroundColor: designTokens.color.mutedFill,
  };
}

export function coverArtworkFrameStyle(
  emphasized: boolean,
  frameRadius?: number,
): ViewStyle {
  const webTransition =
    Platform.OS === 'web'
      ? ({
          transitionDuration: `${designTokens.motion.media}ms`,
          transitionProperty: 'transform',
          transitionTimingFunction: designTokens.motion.easing,
        } as ViewStyle)
      : undefined;

  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...(frameRadius != null
      ? { borderRadius: frameRadius, overflow: 'hidden' as const }
      : null),
    transform: [{ scale: emphasized ? coverArtworkScale : 1 }],
    ...webTransition,
  };
}

export function coverChipRowStyle(): ViewStyle {
  return {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: designTokens.space.chipGap,
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
    paddingTop: designTokens.space.x5,
    paddingBottom: designTokens.space.coverPad,
    paddingHorizontal: designTokens.space.coverPad,
    alignItems: 'center',
  };
}

export function coverOverlayPadStyle(): ViewStyle {
  return {
    padding: designTokens.space.coverPad,
    gap: designTokens.space.coverGap,
  };
}
