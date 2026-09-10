export const creatorProfileTabs = [
  { id: 'works', label: 'Работы' },
  { id: 'about', label: 'Об авторе' },
] as const;

export type CreatorProfileTabId = (typeof creatorProfileTabs)[number]['id'];

export function creatorWorksTabLabel(count: number) {
  return `Работы ${count}`;
}

export function parseCreatorProfileTabParam(
  value: string | readonly string[] | undefined,
): CreatorProfileTabId {
  const candidate = Array.isArray(value) ? value[0] : value;
  return creatorProfileTabs.some((tab) => tab.id === candidate)
    ? (candidate as CreatorProfileTabId)
    : 'works';
}

export function getCreatorProfileTabAt(index: number): CreatorProfileTabId {
  const normalizedIndex =
    ((index % creatorProfileTabs.length) + creatorProfileTabs.length) %
    creatorProfileTabs.length;
  return creatorProfileTabs[normalizedIndex].id;
}
