import { Decimal } from '@bidplace/database';

import { calculateBidStep as calculateBidStepPolicy } from './pricing-policy';

export function calculateBidStep(amount: Decimal): Decimal {
  return calculateBidStepPolicy(amount);
}
