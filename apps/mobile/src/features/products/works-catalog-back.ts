import type { Href } from 'expo-router';

import {
  navigateBack,
  type NavigateBackRouter,
} from '../../components/layout/navigate-back';

export function navigateWorksCatalogBack(router: NavigateBackRouter) {
  navigateBack(router, { fallbackHref: '/works' as Href });
}
