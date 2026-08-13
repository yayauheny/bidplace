export function getApiUrl(): string {
  const developmentDefault = 'http://localhost:3001';
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!configured) {
    if (process.env.NODE_ENV !== 'production') return developmentDefault;

    throw new Error('EXPO_PUBLIC_API_URL is required in production');
  }

  const url = new URL(configured);
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.hostname === 'undefined' ||
    url.hostname === 'null'
  ) {
    throw new Error('EXPO_PUBLIC_API_URL must be an absolute HTTP(S) URL');
  }

  return url.origin;
}

export function getApiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = `/${path.replace(/^\/+/, '')}`;
  return `${getApiUrl()}${normalizedPath}`;
}
