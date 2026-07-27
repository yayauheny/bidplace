import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';

type MotionPressableProps = ComponentProps<typeof Pressable> & { preset?: 'icon' | 'button' | 'card' | 'primaryAction' };

const pressedOpacity = { icon: 0.6, button: 0.92, card: 0.96, primaryAction: 0.9 } as const;

export function MotionPressable({ preset = 'button', disabled, style, ...props }: MotionPressableProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={(state) => [typeof style === 'function' ? style(state) : style, { opacity: disabled ? 0.5 : state.pressed ? pressedOpacity[preset] : 1 }]}
    />
  );
}
