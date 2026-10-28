import type { Href } from 'expo-router';

export type NavigateBackRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
};

export function navigateBack(
  router: NavigateBackRouter,
  { fallbackHref }: { fallbackHref: Href },
) {
  // Expo's index anchor can exist without a real previous browser entry.
  // The root history owner stamps this index on every application entry.
  const state: unknown =
    typeof window === 'undefined' ? null : window.history.state;
  const initialBrowserEntry =
    state !== null &&
    typeof state === 'object' &&
    'index' in state &&
    state.index === 0;
  if (!initialBrowserEntry && router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallbackHref);
}
