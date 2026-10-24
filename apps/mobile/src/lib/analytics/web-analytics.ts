import {
  publicPageSchema,
  type PublicAnalyticsPage,
  type WebAnalyticsRequest,
} from '@bidplace/contracts';

export function publicAnalyticsPage(
  pathname: string,
  search: string,
): PublicAnalyticsPage | null {
  const query = new URLSearchParams(search);
  if (query.has('preview')) return null;
  if (pathname === '/') return { page: 'home' };
  if (pathname === '/works') return { page: 'works' };
  if (pathname === '/authors') return { page: 'authors' };
  const work = /^\/product\/([^/]+)$/.exec(pathname);
  const author = /^\/seller\/([^/]+)$/.exec(pathname);
  const result = publicPageSchema.safeParse(
    work
      ? { page: 'work', publicId: work[1] }
      : author
        ? { page: 'author', slug: author[1] }
        : null,
  );
  return result.success ? result.data : null;
}

export function webAttribution(
  href: string,
  referrer: string,
): WebAnalyticsRequest['attribution'] {
  const url = new URL(href);
  const attribution: NonNullable<WebAnalyticsRequest['attribution']> = {};
  for (const key of ['source', 'medium', 'campaign', 'content'] as const) {
    const value = url.searchParams.get(`utm_${key}`);
    if (value && /^[\p{L}\p{N}_. -]{1,120}$/u.test(value))
      attribution[key] = value;
  }
  if (referrer && URL.canParse(referrer)) {
    const ref = new URL(referrer);
    if (
      ['http:', 'https:'].includes(ref.protocol) &&
      ref.hostname !== url.hostname &&
      /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(ref.hostname)
    )
      attribution.referrerHost = ref.hostname;
  }
  return attribution;
}

export class WebAnalyticsCollector {
  private readonly queue: WebAnalyticsRequest['events'] = [];
  private firstAttribution: WebAnalyticsRequest['attribution'] | null = null;
  private delivery: Promise<void> = Promise.resolve();
  constructor(
    private readonly ingest: (body: WebAnalyticsRequest) => Promise<unknown>,
  ) {}
  async view(
    page: PublicAnalyticsPage,
    attribution: WebAnalyticsRequest['attribution'],
  ) {
    if (this.firstAttribution === null)
      this.firstAttribution = attribution ?? {};
    this.queue.push({ eventId: crypto.randomUUID(), page });
    const flush = async () => {
      while (this.queue.length) {
        const events = this.queue.slice(0, 25);
        await this.ingest({
          events,
          ...(this.firstAttribution
            ? { attribution: this.firstAttribution }
            : {}),
        });
        this.queue.splice(0, events.length);
      }
    };
    const send = () =>
      navigator.locks
        ? navigator.locks.request('bidplace-web-analytics-v2', flush)
        : flush();
    // shortcut: cold tabs can split browser identities without Web Locks; require cross-tab coordination if exact first-visit counts become necessary.
    this.delivery = this.delivery.then(send, send);
    await this.delivery;
  }
}
