import type { ServerEnv } from '../config';
export abstract class PublicMediaCache {
  abstract purge(urls: readonly string[]): Promise<void>;
}
export class CloudflarePublicMediaCache extends PublicMediaCache {
  constructor(private readonly env: ServerEnv) {
    super();
  }
  async purge(urls: readonly string[]) {
    const base = this.env.MEDIA_PUBLIC_BASE_URL;
    if (
      !base ||
      !this.env.CLOUDFLARE_ZONE_ID ||
      !this.env.CLOUDFLARE_CACHE_TOKEN
    )
      throw new Error('CDN purge is not configured');
    for (const url of urls)
      if (new URL(url).origin !== new URL(base).origin)
        throw new Error('Invalid purge origin');
    for (let index = 0; index < urls.length; index += 30) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.env.CLOUDFLARE_CACHE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: urls.slice(index, index + 30) }),
          signal: AbortSignal.timeout(15_000),
        },
      );
      const body: unknown = await response.json();
      if (
        !response.ok ||
        typeof body !== 'object' ||
        body === null ||
        !('success' in body) ||
        body.success !== true
      )
        throw new Error('CDN purge failed');
    }
  }
}
export function publicMediaUrl(base: string, key: string) {
  const origin = new URL(base);
  if (
    origin.protocol !== 'https:' ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password ||
    origin.hostname.endsWith('.r2.dev') ||
    !/^assets\/[a-f0-9-]{36}\/p1\/(preview|full)\.webp$/.test(key)
  )
    throw new Error('Invalid public media URL');
  return new URL(key, origin).href;
}
