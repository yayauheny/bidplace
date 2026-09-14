import { type z } from 'zod';
import { portfolioWorkDetailResponseSchema } from '@bidplace/contracts';

export type PortfolioWorkDetailResponse = z.infer<
  typeof portfolioWorkDetailResponseSchema
>;
