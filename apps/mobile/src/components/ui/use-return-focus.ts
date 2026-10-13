import { useRef } from 'react';

type FocusRef = { current: { focus?: () => void } | null };

function connectedOpener(active: Element | null, scope: EventTarget | null) {
  if (!(active instanceof HTMLElement) || !active.isConnected) return null;
  if (scope instanceof Node && scope.contains(active)) return null;
  if (
    active === active.ownerDocument.body ||
    active === active.ownerDocument.documentElement
  )
    return null;
  return active;
}

export function useReturnFocus({
  explicitRef,
  focusOnOpen,
  shouldRestore,
}: {
  explicitRef?: FocusRef;
  focusOnOpen?: () => HTMLElement | null;
  shouldRestore?: () => boolean;
} = {}) {
  const openerRef = useRef<HTMLElement | null>(null);

  return {
    onOpenAutoFocus: (event: Event) => {
      if (typeof document === 'undefined') return;
      const opener = connectedOpener(
        document.activeElement,
        event.currentTarget,
      );
      if (opener) openerRef.current = opener;
      const target = focusOnOpen?.();
      if (!target) return;
      event.preventDefault();
      target.focus();
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      if (shouldRestore && !shouldRestore()) return;
      const explicit = explicitRef?.current;
      const opener = openerRef.current;
      openerRef.current = null;
      if (explicit) {
        explicit.focus?.();
      } else if (opener?.isConnected) {
        opener.focus({ preventScroll: true });
      }
    },
  };
}
