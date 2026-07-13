import { Decimal } from '@prisma/client/runtime/library';

import { calculateBidStep as calculateBidStepPolicy } from './pricing-policy';

export function calculateBidStep(amount: Decimal): Decimal {
  return calculateBidStepPolicy(amount);
}
