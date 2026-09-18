import { figmaTokens } from '@bidplace/design-tokens';

export const SEARCH_DOCK_BUTTON_ID = 'search-dock-button';

export const figmaDockItemIds = ['home', 'search', 'plus', 'profile'] as const;

export type FigmaDockItemId = (typeof figmaDockItemIds)[number];

export const figmaDeferredDockItemIds = ['cart'] as const;

export const figmaUnusedDockVariantIds = [
  'split-search-fab',
  'five-icon-cart-pill',
] as const;

export type FigmaDockItem = {
  id: FigmaDockItemId;
  label: string;
  icon: 'logo' | 'search-01' | 'plus' | 'user';
};

export const figmaDockItems: readonly FigmaDockItem[] = [
  { id: 'home', label: 'Главная', icon: 'logo' },
  { id: 'search', label: 'Поиск', icon: 'search-01' },
  { id: 'plus', label: 'Добавить', icon: 'plus' },
  { id: 'profile', label: 'Профиль', icon: 'user' },
];

export function figmaDockSurfaceSize(
  itemCount: number = figmaDockItems.length,
) {
  return {
    width:
      figmaTokens.space.dockPad * 2 +
      figmaTokens.size.control * itemCount +
      figmaTokens.space.dockGap * Math.max(itemCount - 1, 0),
    height: figmaTokens.space.dockPad * 2 + figmaTokens.size.control,
  };
}

export function dockItemAccessibility(
  id: FigmaDockItemId,
  selected: boolean,
): {
  role: 'link' | 'button';
  accessibilityState: { selected?: boolean };
  ariaCurrent?: 'page';
} {
  if (id === 'plus') {
    return { role: 'button', accessibilityState: {} };
  }

  if (id === 'search') {
    return { role: 'button', accessibilityState: { selected } };
  }

  return {
    role: 'link',
    accessibilityState: { selected },
    ariaCurrent: selected ? 'page' : undefined,
  };
}

export function isFigmaDockItemSelected(
  id: FigmaDockItemId,
  pathname: string,
) {
  switch (id) {
    case 'home':
      return pathname === '/' || pathname === '';
    case 'search':
      return pathname === '/search' || pathname.startsWith('/search/');
    case 'plus':
      return (
        pathname === '/products/new' || pathname.startsWith('/products/new')
      );
    case 'profile':
      return (
        pathname === '/profile' ||
        pathname.startsWith('/profile/') ||
        pathname === '/login' ||
        pathname.startsWith('/login') ||
        pathname === '/admin' ||
        pathname.startsWith('/admin/')
      );
  }
}
