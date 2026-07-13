import { getPublicApiUrl } from './public-env';

export function resolveMediaUrl(source: string): string {
  if (/^https?:\/\//.test(source)) {
    return source;
  }

  return new URL(source, getPublicApiUrl()).toString();
}
