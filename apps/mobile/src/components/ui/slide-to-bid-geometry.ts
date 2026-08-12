export const slideToBidTrackHeight = 56;
export const slideToBidTrackPadding = 4;
export const slideToBidControlRatio = 360 / 488;
export const slideToBidCompletionThreshold = 0.92;

export function getSlideToBidGeometry(trackWidth: number) {
  const controlWidth = Math.max(
    slideToBidTrackHeight - slideToBidTrackPadding * 2,
    Math.min(
      trackWidth * slideToBidControlRatio,
      trackWidth - slideToBidTrackPadding * 2,
    ),
  );
  return {
    controlWidth,
    maxOffset: Math.max(
      0,
      trackWidth - controlWidth - slideToBidTrackPadding * 2,
    ),
  };
}

export function shouldCompleteSlideToBid(offset: number, maxOffset: number) {
  return maxOffset > 0 && offset / maxOffset >= slideToBidCompletionThreshold;
}
