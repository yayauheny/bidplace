export function resolveMediaUrl(source: string, baseUrl: string): string {
  if (/^https?:\/\//.test(source)) {
    return source;
  }

  return new URL(source, baseUrl).toString();
}
