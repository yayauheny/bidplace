import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  cycleOverlayTabFocus,
  isDisplayedFocusable,
  OVERLAY_FOCUSABLE_SELECTOR,
} from './overlay-focus';

type FocusTarget = { focus?: (options?: { preventScroll?: boolean }) => void };

export function useOverlayFocusTrap({
  open,
  surfaceId,
  restoreOnClose = false,
  returnFocusRef,
}: {
  open: boolean;
  surfaceId: string;
  restoreOnClose?: boolean;
  returnFocusRef?: { current: FocusTarget | null };
}) {
  const openerRef = useRef<FocusTarget | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (open) {
      openerRef.current = document.activeElement as FocusTarget | null;
    } else if (wasOpenRef.current && restoreOnClose) {
      const opener = returnFocusRef?.current ?? openerRef.current;
      requestAnimationFrame(() => opener?.focus?.());
    }
    wasOpenRef.current = open;
  }, [open, restoreOnClose, returnFocusRef]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const root = document.getElementById(surfaceId);
    if (!root) return;

    const focusables = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(OVERLAY_FOCUSABLE_SELECTOR),
      ).filter((node) => isDisplayedFocusable(node));

    focusables()[0]?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const wrapTo = cycleOverlayTabFocus({
        shiftKey: event.shiftKey,
        active: document.activeElement,
        nodes: focusables(),
      });
      if (!wrapTo) return;
      event.preventDefault();
      wrapTo.focus({ preventScroll: true });
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!root.contains(event.target as Node)) {
        focusables()[0]?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open, surfaceId]);

  return {
    restoreFocus() {
      if (Platform.OS !== 'web') return;
      const opener = returnFocusRef?.current ?? openerRef.current;
      requestAnimationFrame(() => opener?.focus?.());
    },
  };
}
