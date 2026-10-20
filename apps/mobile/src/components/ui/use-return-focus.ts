import { useEffect, useRef } from 'react';

type FocusRef = { current: { focus?: () => void } | null };

type StoredOpener = {
  element: HTMLElement | null;
  // Semantic identity of an opener that can be remounted while the dialog is
  // open (aria-label scoped by the nearest testid landmark, e.g. the dock):
  // resolved lazily against the live document on restore.
  selector: string | null;
};

const dialogOpeners = new WeakMap<HTMLElement, readonly StoredOpener[]>();

// Set right before a navigation that opens a dialog whose trigger unmounts
// during the opening transition (the dock disappears under the auth sheet).
// Consumed by the next dialog open; never stacked.
let pendingOpenerSelector: string | null = null;

export function rememberPendingOpener(selector: string) {
  pendingOpenerSelector = selector;
}

function takePendingOpener(): string | null {
  const selector = pendingOpenerSelector;
  pendingOpenerSelector = null;
  return selector;
}

function openerSelectorFor(element: HTMLElement): string | null {
  const label = element.getAttribute('aria-label');
  if (!label || typeof CSS === 'undefined' || !CSS.escape) return null;
  const scope = element.closest('[data-testid]')?.getAttribute('data-testid');
  return scope
    ? `[data-testid="${CSS.escape(scope)}"] [aria-label="${CSS.escape(label)}"]`
    : `[aria-label="${CSS.escape(label)}"]`;
}

function resolveStoredOpener(entry: StoredOpener): HTMLElement | null {
  if (entry.element?.isConnected) return entry.element;
  if (!entry.selector || typeof document === 'undefined') return null;
  const match = document.querySelector<HTMLElement>(entry.selector);
  if (!match || !match.isConnected) return null;
  // A rematched opener must never sit inside another dialog.
  if (match.closest('[role="dialog"]')) return null;
  return match;
}

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
  fallback,
  open,
}: {
  open?: boolean;
  explicitRef?: FocusRef;
  focusOnOpen?: () => HTMLElement | null;
  shouldRestore?: () => boolean;
  fallback?: () => HTMLElement | null;
} = {}) {
  const openerRef = useRef<readonly StoredOpener[]>([]);

  const restoreFocus = () => {
    if (typeof document === 'undefined' || (shouldRestore && !shouldRestore()))
      return;
    const explicit = explicitRef?.current;
    if (explicit) {
      explicit.focus?.();
      openerRef.current = [];
      return;
    }
    const entries = openerRef.current;
    openerRef.current = [];
    for (const entry of entries) {
      const target = resolveStoredOpener(entry);
      if (target) {
        target.focus({ preventScroll: true });
        return;
      }
    }
    // The trigger is gone for good: land on the page's existing navigation
    // point instead of leaving focus on body.
    fallback?.()?.focus?.({ preventScroll: true });
  };

  const restoreRef = useRef(restoreFocus);
  restoreRef.current = restoreFocus;
  const wasOpen = useRef(open);
  useEffect(() => {
    // Restore after the closed focus scope commits; cancel a rapid reopen.
    const frame =
      wasOpen.current === true && open === false
        ? requestAnimationFrame(() => restoreRef.current())
        : null;
    wasOpen.current = open;
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [open]);

  return {
    onOpenAutoFocus: (event: Event) => {
      if (typeof document === 'undefined') return;
      const opener = connectedOpener(
        document.activeElement,
        event.currentTarget,
      );
      const pending = takePendingOpener();
      if (opener) {
        const parent = opener.closest<HTMLElement>('[role="dialog"]');
        openerRef.current = [
          { element: opener, selector: openerSelectorFor(opener) },
          ...(parent ? (dialogOpeners.get(parent) ?? []) : []),
        ];
      } else if (pending) {
        openerRef.current = [{ element: null, selector: pending }];
      }
      if (event.currentTarget instanceof HTMLElement)
        dialogOpeners.set(event.currentTarget, openerRef.current);
      const target = focusOnOpen?.();
      if (!target) return;
      event.preventDefault();
      target.focus();
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      restoreFocus();
    },
  };
}
