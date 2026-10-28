export const SEARCH_DOCK_BUTTON_ID = 'search-dock-button';

export const figmaDockItemIds = ['home', 'search', 'plus', 'profile'] as const;

export type FigmaDockItemId =
  | (typeof figmaDockItemIds)[number]
  | 'moderation'
  | 'analytics';

export type FigmaDockItem = {
  id: FigmaDockItemId;
  label: string;
  icon: 'home-01' | 'search-01' | 'plus' | 'user' | 'clipboard-check' | 'chart';
  href?: '/admin' | '/analytics';
};

export const figmaDockItems: readonly FigmaDockItem[] = [
  { id: 'home', label: 'Главная', icon: 'home-01' },
  { id: 'search', label: 'Поиск', icon: 'search-01' },
  { id: 'plus', label: 'Добавить', icon: 'plus' },
  { id: 'profile', label: 'Профиль', icon: 'user' },
];

export function getFigmaDockItems(access: {
  canModerate: boolean;
  canReadAnalytics: boolean;
}): readonly FigmaDockItem[] {
  if (!access.canModerate && !access.canReadAnalytics) return figmaDockItems;
  return [
    ...figmaDockItems.slice(0, 2),
    ...(access.canModerate
      ? [
          {
            id: 'moderation' as const,
            label: 'Модерация',
            icon: 'clipboard-check' as const,
            href: '/admin' as const,
          },
        ]
      : []),
    ...(access.canReadAnalytics
      ? [
          {
            id: 'analytics' as const,
            label: 'Аналитика',
            icon: 'chart' as const,
            href: '/analytics' as const,
          },
        ]
      : []),
    figmaDockItems[3]!,
  ];
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

export function isFigmaDockItemSelected(id: FigmaDockItemId, pathname: string) {
  switch (id) {
    case 'home':
      return pathname === '/' || pathname === '';
    case 'search':
      return pathname === '/explore' || pathname === '/search' || pathname.startsWith('/search/');
    case 'plus':
      return (
        pathname === '/products/new' || pathname.startsWith('/products/new')
      );
    case 'moderation':
      return pathname === '/admin' || pathname.startsWith('/admin/');
    case 'analytics':
      return pathname === '/analytics';
    case 'profile':
      return (
        pathname === '/account' ||
        pathname.startsWith('/account/') ||
        pathname === '/profile' ||
        pathname.startsWith('/profile/') ||
        pathname === '/cabinet' ||
        pathname.startsWith('/cabinet/') ||
        pathname === '/login' ||
        pathname.startsWith('/login')
      );
  }
}
