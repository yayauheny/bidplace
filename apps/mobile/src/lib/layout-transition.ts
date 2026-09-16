import {
  Easing,
  FadeInUp,
  FadeOutUp,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';
import { designTokens } from '@bidplace/design-tokens';

export const controlLayoutTransition = LinearTransition.duration(
  designTokens.motion.control,
)
  .easing(Easing.bezier(0.2, 0, 0, 1))
  .reduceMotion(ReduceMotion.System);

export const controlEnterFromAbove = FadeInUp.duration(
  designTokens.motion.control,
)
  .easing(Easing.bezier(0.2, 0, 0, 1))
  .reduceMotion(ReduceMotion.System);

export const controlExitUp = FadeOutUp.duration(designTokens.motion.control)
  .easing(Easing.bezier(0.2, 0, 0, 1))
  .reduceMotion(ReduceMotion.System);
