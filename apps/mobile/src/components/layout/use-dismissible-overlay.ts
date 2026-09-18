import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import {
  isEscapeKey,
  shouldCloseOnPointerDown,
  type ContainsLike,
} from './dismissible-overlay';

export type DismissReason = 'escape' | 'pointerdown' | 'focusin';

type UseDismissibleOverlayArgs = {
  open: boolean;
  onClose: (reason: DismissReason) => void;
  getSurfaces: () => Array<ContainsLike | null | undefined>;
  restoreFocus?: () => void;
  closeOnFocusIn?: boolean;
};

export function useDismissibleOverlay({
  open,
  onClose,
  getSurfaces,
  restoreFocus,
  closeOnFocusIn = false,
}: UseDismissibleOverlayArgs) {
  const onCloseRef = useRef(onClose);
  const getSurfacesRef = useRef(getSurfaces);
  const restoreFocusRef = useRef(restoreFocus);
  onCloseRef.current = onClose;
  getSurfacesRef.current = getSurfaces;
  restoreFocusRef.current = restoreFocus;

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;

    const closeWith = (reason: DismissReason) => {
      onCloseRef.current(reason);
      if (reason === 'escape') restoreFocusRef.current?.();
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (!isEscapeKey(event)) return;
      event.preventDefault();
      closeWith('escape');
    };

    const closeOnPointerDown = (event: PointerEvent) => {
      const surfaces = getSurfacesRef.current();
      const target = event.target;
      if (shouldCloseOnPointerDown(target, surfaces)) {
        closeWith('pointerdown');
      }
    };

    const closeOnFocusIn = (event: FocusEvent) => {
      if (!closeOnFocusIn) return;
      const surfaces = getSurfacesRef.current();
      const target = event.target;
      if (shouldCloseOnPointerDown(target, surfaces)) {
        closeWith('focusin');
      }
    };

    document.addEventListener('keydown', closeOnEscape, true);
    document.addEventListener('pointerdown', closeOnPointerDown);
    if (closeOnFocusIn) {
      document.addEventListener('focusin', closeOnFocusIn);
    }

    return () => {
      document.removeEventListener('keydown', closeOnEscape, true);
      document.removeEventListener('pointerdown', closeOnPointerDown);
      if (closeOnFocusIn) {
        document.removeEventListener('focusin', closeOnFocusIn);
      }
    };
  }, [closeOnFocusIn, open]);
}

