export const figmaDockItemIds = ['home', 'search', 'plus', 'profile'] as const;

export type FigmaDockItemId = (typeof figmaDockItemIds)[number];

export const figmaDeferredDockItemIds = ['cart'] as const;

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
