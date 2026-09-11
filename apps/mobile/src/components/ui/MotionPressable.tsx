import {
  forwardRef,
  useState,
  type ComponentProps,
  type ElementRef,
  type ReactNode,
} from 'react';
import {
  Platform,
  Pressable,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useReducedMotion } from '../../lib/reduced-motion';
import {
  motionPressableFeedback,
  type MotionPressablePreset,
} from './motion-pressable-feedback';

export type MotionPressableState = PressableStateCallbackType & {
  focused: boolean;
  hovered: boolean;
};

type MotionPressableProps = Omit<
  ComponentProps<typeof Pressable>,
  'style' | 'children'
> & {
  children?:
    | ReactNode
    | ((state: MotionPressableState) => ReactNode);
  interactionStyle?: (state: MotionPressableState) => StyleProp<ViewStyle>;
  preset?: MotionPressablePreset;
  style?:
    | StyleProp<ViewStyle>
    | ((state: MotionPressableState) => StyleProp<ViewStyle>);
};

export const MotionPressable = forwardRef<
  ElementRef<typeof Pressable>,
  MotionPressableProps
>(function MotionPressable(
  {
    preset = 'button',
    disabled,
    interactionStyle,
    onBlur,
    onFocus,
    onHoverIn,
    onHoverOut,
    style,
    children,
    ...props
  },
  ref,
) {
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const feedback = motionPressableFeedback(preset, reducedMotion);
  const transitionStyle =
    Platform.OS === 'web'
      ? ({
          transitionDuration: `${feedback.transitionDuration}ms`,
          transitionProperty:
            'background-color, border-color, opacity, transform',
          transitionTimingFunction: designTokens.motion.easing,
        } as unknown as ViewStyle)
      : undefined;

  return (
    <Pressable
      {...props}
      ref={ref}
      children={
        typeof children === 'function'
          ? (pressState) =>
              children({ ...pressState, focused, hovered })
          : children
      }
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
            : state.pressed
              ? feedback.pressedOpacity
              : 1,
        },
      ]}
    />
  );
});
