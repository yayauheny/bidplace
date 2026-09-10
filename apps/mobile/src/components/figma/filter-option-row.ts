export type FilterOptionRowMode = 'single' | 'multi' | 'disclosure';

export type FilterOption = {
  id: string;
  label: string;
};

export const HIDDEN_FILTER_GROUP_IDS = ['price', 'auction', 'lots'] as const;

export function isHiddenFilterGroup(id: string) {
  return (HIDDEN_FILTER_GROUP_IDS as readonly string[]).includes(id);
}

export function visibleFilterGroups<T extends { id: string }>(groups: readonly T[]) {
  return groups.filter((group) => !isHiddenFilterGroup(group.id));
}

export function toggleMultiFilterValue(
  selected: readonly string[],
  value: string,
) {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

export const FILTER_OPTION_CONTROL_SIZE = 20;
