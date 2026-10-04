import {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { designTokens } from '@bidplace/design-tokens';

const controlEasing = Easing.bezier(0.2, 0, 0, 1);

export const controlLayoutTransition = LinearTransition.duration(
  designTokens.motion.control,
)
  .easing(controlEasing)
  .reduceMotion(ReduceMotion.System);

export const sheetEnter = (onFinished: (finished: boolean) => void) =>
  SlideInDown.duration(designTokens.motion.control)
    .easing(controlEasing)
    .reduceMotion(ReduceMotion.System)
    .withCallback(onFinished);

export const sheetExit = SlideOutDown.duration(designTokens.motion.control)
  .easing(controlEasing)
  .reduceMotion(ReduceMotion.System);

export const sheetBackdropEnter = FadeIn.duration(designTokens.motion.control)
  .easing(controlEasing)
  .reduceMotion(ReduceMotion.System);

export const sheetBackdropExit = FadeOut.duration(designTokens.motion.control)
  .easing(controlEasing)
  .reduceMotion(ReduceMotion.System);
