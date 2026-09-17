export type InfrastructurePageFetchStatus = 'loading' | 'error' | 'ready';
export type InfrastructurePageVisualStatus = 'loading' | 'error';

export function infrastructurePageFetchStatus(query: {
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  data?: unknown;
}): InfrastructurePageFetchStatus {
  if (query.data != null) {
    return 'ready';
  }
  if (query.isPending || query.isFetching) {
    return 'loading';
  }
  if (query.isError) {
    return 'error';
  }
  return 'ready';
}

export function combineInfrastructurePageStatus(
  statuses: readonly InfrastructurePageFetchStatus[],
): InfrastructurePageFetchStatus {
  if (statuses.some((status) => status === 'loading')) {
    return 'loading';
  }
  if (statuses.some((status) => status === 'error')) {
    return 'error';
  }
  return 'ready';
}

export function infrastructurePageVisual(
  status: InfrastructurePageVisualStatus,
  settled: boolean,
) {
  return {
    logoMotion: status === 'loading' || !settled ? 'loading' : 'error',
    showsErrorChrome: status === 'error' && settled,
  } as const;
}
