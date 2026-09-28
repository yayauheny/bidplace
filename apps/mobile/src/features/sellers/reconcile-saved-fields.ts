export function persistedFieldOverrides<T extends Record<string, string>>(
  submitted: T,
  current: T,
  persisted: T,
): Partial<T> {
  const overrides: Partial<T> = {};
  for (const key of Object.keys(persisted) as Array<keyof T>) {
    if (current[key] !== submitted[key] && current[key] !== persisted[key]) {
      overrides[key] = current[key];
    }
  }
  return overrides;
}
