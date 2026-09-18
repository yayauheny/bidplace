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
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallbackHref);
}
