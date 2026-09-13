export type SearchParam = string | string[] | undefined;

export function firstSearchParam(value: SearchParam) {
  return Array.isArray(value) ? value[0] : value;
}

export function optionalRouteText<Key extends string>(
  key: Key,
  value: string | undefined,
  maxLength: number,
): Partial<Record<Key, string>> {
  const normalized = value?.trim();
  return normalized && normalized.length <= maxLength
    ? ({ [key]: normalized } as Record<Key, string>)
    : {};
}
