export type PageStateMode = 'loading' | 'empty' | 'error';

export function getPageStateMode({
  loading,
  retry,
}: {
  loading: boolean;
  retry: boolean;
}): PageStateMode {
  if (loading) return 'loading';
  return retry ? 'error' : 'empty';
}
