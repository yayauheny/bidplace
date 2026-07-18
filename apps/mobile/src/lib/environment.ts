export function getApiUrl(): string {
  const fallback = 'http://127.0.0.1:3001';
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!configured) {
    return fallback;
  }

  try {
    const url = new URL(configured);

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.hostname === 'undefined' || url.hostname === 'null'
        ? fallback
        : url.origin
      : fallback;
  } catch {
    return fallback;
  }
}
