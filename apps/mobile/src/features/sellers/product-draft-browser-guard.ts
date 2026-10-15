import { useEffect, useRef } from 'react';

import type { ProductDraftSaveSession } from './product-draft-save';

const productDraftHistoryGuardKey = '__bidplaceProductDraftGuard';

/**
 * Web-only protection of unsaved draft state: the beforeunload banner and the
 * browser Back/Forward guard. The guard pushes a sentinel history entry while
 * the draft is dirty and persists through it when the author navigates back.
 */
export function useProductDraftBrowserHistoryGuard({
  isDirty,
  storyDirty,
  storyPending,
  productId,
  session,
}: {
  isDirty: boolean;
  storyDirty: boolean;
  storyPending: boolean;
  productId?: string;
  session: ProductDraftSaveSession;
}) {
  const browserNavigation = useRef<{
    id: string;
    restoring: boolean;
    allow: boolean;
  } | null>(null);
  const sessionSlot = useRef(session);
  sessionSlot.current = session;

  const retireBrowserGuard = async () => {
    const guard = browserNavigation.current;
    if (
      !guard ||
      guard.allow ||
      typeof window === 'undefined' ||
      window.history.state?.[productDraftHistoryGuardKey] !== guard.id
    )
      return;
    guard.allow = true;
    await new Promise<void>((resolve) => {
      window.addEventListener('popstate', () => resolve(), { once: true });
      window.history.back();
    });
  };

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      (!isDirty && !storyDirty && !storyPending)
    )
      return;

    const guard = {
      id: `${productId ?? 'new'}:${Date.now()}`,
      restoring: false,
      rearming: false,
      persisting: false,
      allow: false,
    };
    browserNavigation.current = guard;
    window.history.pushState(
      {
        ...(window.history.state ?? {}),
        [productDraftHistoryGuardKey]: guard.id,
      },
      '',
      window.location.href,
    );

    const persistAndContinueBrowserBack = () => {
      guard.allow = true;
      guard.persisting = true;
      const operation = sessionSlot.current.snapshotOperation();
      void sessionSlot.current.persistForTransitionRef
        .current?.()
        .then((persisted) => {
          guard.persisting = false;
          if (
            !sessionSlot.current.isCurrentOperation(operation) ||
            !persisted
          ) {
            guard.allow = false;
            return;
          }
          sessionSlot.current.endLockedTransition();
          window.history.go(-2);
        });
    };
    const onPopState = (event: PopStateEvent) => {
      if (event.state?.[productDraftHistoryGuardKey] === guard.id) {
        if (guard.rearming) {
          // Second Back during the in-flight persist: stay on the sentinel so
          // the pending go(-2) lands on the actual previous screen.
          guard.rearming = false;
          return;
        }
        if (guard.restoring) {
          guard.restoring = false;
          persistAndContinueBrowserBack();
        }
        return;
      }
      if (guard.allow) {
        if (guard.persisting) {
          guard.rearming = true;
          window.history.go(1);
        } else {
          guard.allow = false;
        }
        return;
      }
      guard.restoring = true;
      window.history.go(1);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (browserNavigation.current === guard) {
        browserNavigation.current = null;
      }
      // Retire a sentinel the user never consumed (dirty cleared by save or
      // revert): left in place it eats one Back as an empty step on the same URL.
      if (
        !guard.allow &&
        !guard.restoring &&
        window.history.state?.[productDraftHistoryGuardKey] === guard.id
      ) {
        window.history.back();
      }
    };
  }, [isDirty, storyDirty, storyPending, productId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isDirty && !storyDirty && !storyPending) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty, storyDirty, storyPending]);

  return { retireBrowserGuard };
}
