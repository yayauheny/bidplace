export function persistedFieldOverrides<
  T extends Record<string, string | string[]>,
>(submitted: T, current: T, persisted: T): Partial<T> {
  const overrides: Partial<T> = {};
  for (const key of Object.keys(persisted) as Array<keyof T>) {
    if (
      JSON.stringify(current[key]) !== JSON.stringify(submitted[key]) &&
      JSON.stringify(current[key]) !== JSON.stringify(persisted[key])
    ) {
      overrides[key] = current[key];
    }
  }
  return overrides;
}
