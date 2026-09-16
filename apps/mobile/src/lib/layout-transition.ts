import { Easing, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { designTokens } from '@bidplace/design-tokens';

export const controlLayoutTransition = LinearTransition.duration(
  designTokens.motion.control,
)
  .easing(Easing.bezier(0.2, 0, 0, 1))
  .reduceMotion(ReduceMotion.System);
