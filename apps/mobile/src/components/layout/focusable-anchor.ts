import type { MutableRefObject } from 'react';

export type FocusableAnchor = {
  getBoundingClientRect: () => DOMRect;
  focus?: () => void;
};

export function assignFocusableAnchorRef(
  ref: MutableRefObject<FocusableAnchor | null>,
  node: unknown,
) {
  ref.current = node as unknown as FocusableAnchor | null;
}
