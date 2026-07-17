import type { SellerProfile } from '@bidplace/contracts';

import {
  getErrorStatus,
  getUserFacingErrorMessage,
} from '../../lib/errors';
import { useMySellerProfileQuery } from './hooks';

export type SellerProfileRequirementState =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | {
      kind: 'error';
      message: string;
      retry: () => Promise<unknown>;
    }
  | {
      kind: 'ready';
      profile: SellerProfile;
    };

export function useSellerProfileRequirement(
  errorFallbackMessage: string,
): SellerProfileRequirementState {
  const profileQuery = useMySellerProfileQuery();

  if (profileQuery.isLoading) {
    return { kind: 'loading' };
  }

  if (profileQuery.isError) {
    const status = getErrorStatus(profileQuery.error);

    if (status === 404) {
      return { kind: 'missing' };
    }

    return {
      kind: 'error',
      message: getUserFacingErrorMessage(
        profileQuery.error,
        errorFallbackMessage,
      ),
      retry: () => profileQuery.refetch(),
    };
  }

  if (!profileQuery.data) {
    return { kind: 'missing' };
  }

  return {
    kind: 'ready',
    profile: profileQuery.data.sellerProfile,
  };
}
