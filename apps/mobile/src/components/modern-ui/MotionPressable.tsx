import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { useReducedMotion } from '../../lib/reduced-motion';

type MotionPressableProps = ComponentProps<typeof Pressable> & { preset?: 'icon' | 'button' | 'card' | 'primaryAction' };

const pressedOpacity = { icon: 0.6, button: 0.92, card: 0.96, primaryAction: 0.9 } as const;

export function MotionPressable({ preset = 'button', disabled, style, ...props }: MotionPressableProps) {
  const reducedMotion = useReducedMotion();
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={(state) => [typeof style === 'function' ? style(state) : style, { opacity: disabled ? modernTokens.opacity.disabled : reducedMotion ? 1 : state.pressed ? pressedOpacity[preset] : 1 }]}
    />
  );
}
