import { designTokens } from '@bidplace/design-tokens';

export type MotionPressablePreset =
  | 'icon'
  | 'dock'
  | 'button'
  | 'card'
  | 'primaryAction';

const pressedOpacity: Record<MotionPressablePreset, number> = {
  icon: 0.6,
  dock: 0.82,
  button: 0.92,
  card: 0.96,
  primaryAction: 0.9,
};

export type MotionPressableOpacityFeedback = 'preset' | 'component';

export function motionPressableFeedback(
  preset: MotionPressablePreset,
  reducedMotion: boolean,
  opacityFeedback: MotionPressableOpacityFeedback = 'preset',
) {
  const usePresetOpacity = opacityFeedback === 'preset';
  return {
    pressedOpacity:
      !usePresetOpacity || reducedMotion ? 1 : pressedOpacity[preset],
    transitionDuration:
      reducedMotion || preset === 'dock'
        ? reducedMotion
          ? 0
          : designTokens.motion.instant
        : designTokens.motion.control,
  } as const;
}
