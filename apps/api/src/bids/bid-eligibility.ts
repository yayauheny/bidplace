import { ApiErrorCode, CURRENT_RULES_VERSION } from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import { HttpStatus } from '@nestjs/common';

import { AppException } from '../core/errors';
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
    throw new AppException({
      status: HttpStatus.FORBIDDEN,
      code: ApiErrorCode.EMAIL_VERIFICATION_REQUIRED,
      message: 'Email verification is required',
    });
  }

  if (getAcceptedRulesVersion(user) !== CURRENT_RULES_VERSION) {
    throw new AppException({
      status: HttpStatus.FORBIDDEN,
      code: ApiErrorCode.RULES_ACCEPTANCE_REQUIRED,
      message: 'Service rules acceptance is required',
    });
  }
}
