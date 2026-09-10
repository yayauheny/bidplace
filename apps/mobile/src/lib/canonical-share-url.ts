export function canonicalShareUrl(
  sharePath: string,
  origin?: string,
  createUrl?: (path: string) => string,
): string {
  const resolvedOrigin =
    origin ??
    (typeof window !== 'undefined' ? window.location.origin : undefined);
  if (resolvedOrigin) {
    return new URL(sharePath, resolvedOrigin).toString();
  }
  if (!createUrl) {
    throw new Error('canonicalShareUrl requires a native URL factory');
  }
  return createUrl(sharePath);
}
