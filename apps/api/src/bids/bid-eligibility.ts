import { CURRENT_RULES_VERSION } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import { ForbiddenException } from '@nestjs/common';

import {
  getAcceptedRulesVersion,
  latestRulesAcceptanceSelect,
} from '../core/rules-acceptance';

export const bidEligibilityUserSelect = {
  emailVerifiedAt: true,
  termsAcceptances: {
    select: latestRulesAcceptanceSelect,
    orderBy: { acceptedAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.UserSelect;

export type BidEligibilityUser = Prisma.UserGetPayload<{
  select: typeof bidEligibilityUserSelect;
}>;

export function assertBidEligibility(
  user: BidEligibilityUser | null | undefined,
): asserts user is BidEligibilityUser {
  if (!user?.emailVerifiedAt) {
    throw new ForbiddenException('Email verification is required');
  }

  if (getAcceptedRulesVersion(user) !== CURRENT_RULES_VERSION) {
    throw new ForbiddenException('Service rules acceptance is required');
  }
}
