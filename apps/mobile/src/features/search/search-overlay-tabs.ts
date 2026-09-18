export const searchOverlayTabValues = [
  'categories',
  'authors',
  'works',
] as const;

export type SearchOverlayTab = (typeof searchOverlayTabValues)[number];

export const SEARCH_OVERLAY_DEFAULT_TAB: SearchOverlayTab = 'categories';

export const searchOverlayTabs: ReadonlyArray<{
  value: SearchOverlayTab;
  label: string;
}> = [
  { value: 'categories', label: 'Категории' },
  { value: 'authors', label: 'Авторы' },
  { value: 'works', label: 'Работы' },
];

export function isSearchOverlayTab(value: string): value is SearchOverlayTab {
  return (searchOverlayTabValues as readonly string[]).includes(value);
}

export function searchOverlayTabPanelId(tab: SearchOverlayTab): string {
  return `search-overlay-panel-${tab}`;
}
