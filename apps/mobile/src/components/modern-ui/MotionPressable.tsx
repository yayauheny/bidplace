import { useState, type ComponentProps } from 'react';
import {
  Platform,
  Pressable,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useReducedMotion } from '../../lib/reduced-motion';

export type MotionPressableState = PressableStateCallbackType & {
  focused: boolean;
  hovered: boolean;
};

type MotionPressableProps = Omit<ComponentProps<typeof Pressable>, 'style'> & {
  interactionStyle?: (state: MotionPressableState) => StyleProp<ViewStyle>;
  preset?: 'icon' | 'button' | 'card' | 'primaryAction';
  style?:
    | StyleProp<ViewStyle>
    | ((state: MotionPressableState) => StyleProp<ViewStyle>);
};

const pressedOpacity = {
  icon: 0.6,
  button: 0.92,
  card: 0.96,
  primaryAction: 0.9,
} as const;

export function MotionPressable({
  preset = 'button',
  disabled,
  interactionStyle,
  onBlur,
  onFocus,
  onHoverIn,
  onHoverOut,
  style,
  ...props
}: MotionPressableProps) {
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const transitionStyle =
    Platform.OS === 'web'
      ? ({
          transitionDuration: `${reducedMotion ? 0 : designTokens.motion.control}ms`,
          transitionProperty:
            'background-color, border-color, opacity, transform',
          transitionTimingFunction: designTokens.motion.easing,
        } as unknown as ViewStyle)
      : undefined;

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      style={(state) => [
        typeof style === 'function'
          ? style({ ...state, focused, hovered })
          : style,
        interactionStyle?.({ ...state, focused, hovered }),
        transitionStyle,
        {
          opacity: disabled
            ? designTokens.opacity.disabled
            : reducedMotion
              ? 1
              : state.pressed
                ? pressedOpacity[preset]
                : 1,
        },
      ]}
    />
  );
}
