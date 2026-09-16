export type WorkPageBackRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: '/works') => void;
};

export function navigateWorkPageBack(router: WorkPageBackRouter) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/works');
}
