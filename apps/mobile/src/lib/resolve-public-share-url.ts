export function resolvePublicShareUrl(sharePath: string, origin: string) {
  const path = sharePath.trim();
  if (!path) {
    throw new Error('share-path-empty');
  }
  return new URL(path, origin).toString();
}
