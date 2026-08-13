import { describe, expect, it } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';

import { retryTransientPublicQuery } from './query-retry';

describe('retryTransientPublicQuery', () => {
  it.each(['network', 'server', 'rate_limited'] as const)(
    'retries a transient %s error once',
    (kind) => {
      const error = new ApiClientError('temporary', { kind, status: 500 });

      expect(retryTransientPublicQuery(0, error)).toBe(true);
      expect(retryTransientPublicQuery(1, error)).toBe(true);
      expect(retryTransientPublicQuery(2, error)).toBe(false);
    },
  );

  it.each(['bad_request', 'validation', 'unauthorized', 'forbidden', 'not_found', 'conflict'] as const)(
    'does not retry a permanent %s error',
    (kind) => {
      const error = new ApiClientError('permanent', { kind, status: 400 });

      expect(retryTransientPublicQuery(0, error)).toBe(false);
    },
  );
});
