export const workContentTabs = [
  { id: 'story', label: 'История' },
  { id: 'details', label: 'Детали' },
] as const;

export type WorkContentTabId = (typeof workContentTabs)[number]['id'];

export function visibleWorkContentTabs(hasStory: boolean) {
  return workContentTabs.filter((tab) => tab.id !== 'story' || hasStory);
}

export function resolveWorkContentTab(
  active: WorkContentTabId,
  hasStory: boolean,
): WorkContentTabId {
  if (active === 'story' && hasStory) return 'story';
  return 'details';
}

export function getWorkContentTabAt(
  index: number,
  hasStory: boolean,
): WorkContentTabId {
  const tabs = visibleWorkContentTabs(hasStory);
  const normalizedIndex =
    ((index % tabs.length) + tabs.length) % tabs.length;
  return tabs[normalizedIndex].id;
}
