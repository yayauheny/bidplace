import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { createApiClient } from '@bidplace/api-client';

describe('public catalog query cancellation', () => {
  it('aborts the previous works fetch when the query is cancelled', async () => {
    let signal: AbortSignal | undefined;
    let markStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: (_input, init) => {
        signal = init?.signal ?? undefined;
        markStarted();
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, networkMode: 'always' } },
    });
    const first = queryClient.fetchQuery({
      queryKey: ['portfolio-works', { page: 1 }],
      queryFn: ({ signal: querySignal }) =>
        client.portfolio.listWorks({ page: 1 }, { signal: querySignal }),
    });

    await started;
    expect(signal?.aborted).toBe(false);
    await queryClient.cancelQueries({
      queryKey: ['portfolio-works', { page: 1 }],
    });

    expect(signal?.aborted).toBe(true);
    await expect(first).rejects.toThrow('CancelledError');
    expect(
      queryClient.getQueryState(['portfolio-works', { page: 1 }])?.status,
    ).not.toBe('error');
  });
});
