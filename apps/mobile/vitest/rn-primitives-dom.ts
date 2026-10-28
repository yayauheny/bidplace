import { createElement, forwardRef, type ReactNode } from 'react';

type DialogNativeHarness = {
  findNodeHandle: (node: unknown) => number | null;
  setAccessibilityFocus: (node: unknown) => void;
  hardwareBack: (handler: () => boolean | null | undefined) => { remove: () => void };
};

function dialogNativeHarness(): DialogNativeHarness | undefined {
  if (!('__dialogNative' in globalThis)) return undefined;
  return (globalThis as { __dialogNative?: DialogNativeHarness }).__dialogNative;
}

export const Platform = {
  OS: 'web' as const,
  select<T>(options: { web?: T; default?: T }) {
    return options.web ?? options.default;
  },
};

export function findNodeHandle(node: unknown) {
  return dialogNativeHarness()?.findNodeHandle(node) ?? (node ? 1 : null);
}

export const AccessibilityInfo = {
  setAccessibilityFocus(node: unknown) {
    dialogNativeHarness()?.setAccessibilityFocus(node);
  },
  isReduceMotionEnabled: () => Promise.resolve(false),
  addEventListener: () => ({ remove() {} }),
};

export const BackHandler = {
  addEventListener(
    event: string,
    handler: () => boolean | null | undefined,
  ) {
    if (event === 'hardwareBackPress') {
      return dialogNativeHarness()?.hardwareBack(handler) ?? { remove() {} };
    }
    return { remove() {} };
  },
};

export const View = forwardRef<HTMLDivElement, { children?: ReactNode; role?: string; nativeID?: string }>(
  function View({ children, role, nativeID }, ref) {
    return createElement('div', { ref, role, id: nativeID }, children);
  },
);

export const Text = forwardRef<HTMLSpanElement, { children?: ReactNode; role?: string }>(
  function Text({ children, role }, ref) {
    return createElement('span', { ref, role }, children);
  },
);

export const Pressable = forwardRef<
  HTMLButtonElement,
  {
    children?: ReactNode | ((state: { pressed: boolean; hovered: boolean }) => ReactNode);
    accessibilityLabel?: string;
    accessibilityRole?: string;
    disabled?: boolean;
    role?: string;
    onPress?: () => void;
  }
>(function Pressable(props, ref) {
  return createElement(
    'button',
    {
      ref,
      type: 'button',
      'aria-label': props.accessibilityLabel,
      role: props.accessibilityRole ?? props.role,
      disabled: Boolean(props.disabled),
      onClick: () => {
        if (!props.disabled) props.onPress?.();
      },
    },
    typeof props.children === 'function'
      ? props.children({ pressed: false, hovered: false })
      : props.children,
  );
});
