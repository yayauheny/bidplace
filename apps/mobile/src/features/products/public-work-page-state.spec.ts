import { describe, expect, it } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';

import {
  isPublicWorkMissing,
  resolvePublicWorkPageState,
} from './public-work-page-state';

const missingWork = new ApiClientError('Work not found', {
  kind: 'not_found',
  status: 404,
});

const networkError = new ApiClientError('Network request failed', {
  kind: 'network',
  status: 0,
});

describe('isPublicWorkMissing', () => {
  it('treats a 404 portfolio miss as gone, not as a retryable load failure', () => {
    expect(isPublicWorkMissing(missingWork)).toBe(true);
    expect(isPublicWorkMissing(networkError)).toBe(false);
  });
});

describe('resolvePublicWorkPageState', () => {
  it('keeps loading ahead of error branches', () => {
    expect(
      resolvePublicWorkPageState({
        isPending: true,
        isFetching: true,
        isError: true,
        error: missingWork,
        data: undefined,
      }),
    ).toBe('loading');
  });

  it('keeps retrying a failed work load on the branded loading path', () => {
    expect(
      resolvePublicWorkPageState({
        isPending: false,
        isFetching: true,
        isError: true,
        error: networkError,
        data: undefined,
      }),
    ).toBe('loading');
  });

  it('shows a deleted or unpublished work without a retry action', () => {
    expect(
      resolvePublicWorkPageState({
        isPending: false,
        isFetching: false,
        isError: true,
        error: missingWork,
        data: undefined,
      }),
    ).toBe('not_found');
  });

  it('keeps transient failures on the retryable load-error path', () => {
    expect(
      resolvePublicWorkPageState({
        isPending: false,
        isFetching: false,
        isError: true,
        error: networkError,
        data: undefined,
      }),
    ).toBe('error');
  });

  it('does not invent a ready page when the query has no work payload', () => {
    expect(
      resolvePublicWorkPageState({
        isPending: false,
        isFetching: false,
        isError: false,
        error: null,
        data: undefined,
      }),
    ).toBe('error');
  });

  it('returns ready when a work payload is present', () => {
    expect(
      resolvePublicWorkPageState({
        isPending: false,
        isFetching: false,
        isError: false,
        error: null,
        data: { work: { publicId: 'daliEstate1' } },
      }),
    ).toBe('ready');
  });

  it('keeps a loaded work on screen if a later refetch fails', () => {
    expect(
      resolvePublicWorkPageState({
        isPending: false,
        isFetching: false,
        isError: true,
        error: networkError,
        data: { work: { publicId: 'daliEstate1' } },
      }),
    ).toBe('ready');
  });
});
