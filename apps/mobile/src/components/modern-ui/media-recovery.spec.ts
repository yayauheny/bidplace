import { describe, expect, it } from 'vitest';

import {
  addMediaCacheBust,
  beginManualMediaRetry,
  beginMediaRetry,
  createMediaRecoveryState,
  markMediaLoaded,
  mediaRetryDelaysMs,
  recordMediaFailure,
  sanitizeMediaError,
  sanitizeMediaUrl,
} from './media-recovery';

describe('media recovery state', () => {
  it('schedules bounded retries with changing cache-busted URLs', () => {
    let state = createMediaRecoveryState(
      'https://cdn.example.test/image.png?token=secret#fragment',
    );

    for (const [index, delay] of mediaRetryDelaysMs.entries()) {
      const failure = recordMediaFailure(state);

      expect(failure.attempt).toBe(index + 1);
      expect(failure.retryDelayMs).toBe(delay);
      expect(failure.state.failed).toBe(true);
      expect(failure.state.exhausted).toBe(false);

      const next = beginMediaRetry(failure.state);
      expect(next.requestVersion).toBe(index + 1);
      expect(addMediaCacheBust(state.uri, next.requestVersion)).not.toBe(
        state.uri,
      );
      state = next;
    }

    const exhausted = recordMediaFailure(state);
    expect(exhausted.attempt).toBe(4);
    expect(exhausted.retryDelayMs).toBeNull();
    expect(exhausted.state.exhausted).toBe(true);
  });

  it('resets failure state after a successful load and manual retry', () => {
    const failed = recordMediaFailure(
      createMediaRecoveryState('/image.png'),
    ).state;
    const recovered = markMediaLoaded(failed);

    expect(recovered.failureCount).toBe(0);
    expect(recovered.failed).toBe(false);
    expect(recovered.exhausted).toBe(false);

    const exhausted = {
      ...recovered,
      failureCount: 4,
      failed: true,
      exhausted: true,
    };
    const manualRetry = beginManualMediaRetry(exhausted);

    expect(manualRetry.failureCount).toBe(0);
    expect(manualRetry.failed).toBe(false);
    expect(manualRetry.exhausted).toBe(false);
    expect(manualRetry.requestVersion).toBe(exhausted.requestVersion + 1);
  });

  it('starts a fresh recovery cycle when the image URL changes', () => {
    const failed = recordMediaFailure(
      createMediaRecoveryState('/old-image.png'),
    ).state;
    const nextUrl = createMediaRecoveryState('/new-image.png');

    expect(failed.failed).toBe(true);
    expect(nextUrl.uri).toBe('/new-image.png');
    expect(nextUrl.failureCount).toBe(0);
    expect(nextUrl.requestVersion).toBe(0);
    expect(nextUrl.exhausted).toBe(false);
  });

  it('removes query credentials from diagnostic URLs and messages', () => {
    const uri = 'https://cdn.example.test/image.png?token=secret';

    expect(sanitizeMediaUrl(uri)).toBe('https://cdn.example.test/image.png');
    expect(
      sanitizeMediaError(`Failed to load image from url: ${uri}`, uri),
    ).toBe('Failed to load image from url: https://cdn.example.test/image.png');
  });

  it('preserves fragments while adding a retry parameter', () => {
    expect(addMediaCacheBust('/api/images/123#preview', 2)).toBe(
      '/api/images/123?media_retry=2#preview',
    );
    expect(addMediaCacheBust('/api/images/123?size=large', 2)).toBe(
      '/api/images/123?size=large&media_retry=2',
    );
  });
});
