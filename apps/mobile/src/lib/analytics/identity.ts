export type AnalyticsIdentityState = {
  anonymousId: string;
  userId: string | null;
};

/**
 * Logout clears authenticated userId only. anonymousId is installation-scoped
 * and must stay stable across sessions. Never alias User A to User B by
 * rewriting anonymousId after identify/reset.
 */
export function identifyUser(
  state: AnalyticsIdentityState,
  userId: string,
): AnalyticsIdentityState {
  return {
    anonymousId: state.anonymousId,
    userId,
  };
}

export function resetUser(
  state: AnalyticsIdentityState,
): AnalyticsIdentityState {
  return {
    anonymousId: state.anonymousId,
    userId: null,
  };
}
