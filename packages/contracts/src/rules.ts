import { z } from 'zod';

import { authResponseSchema } from './auth';
import { isoDateTimeSchema } from './primitives';

export const CURRENT_RULES_VERSION = 'MVP_RULES_V1' as const;

export const serviceRulesSchema = z
  .object({
    version: z.string().trim().min(1),
    owner: z.string().trim().min(1),
    contact: z.string().trim().min(1),
    text: z.string().trim().min(1),
    updatedAt: isoDateTimeSchema.nullable().optional(),
  })
  .strict();

export const serviceRulesResponseSchema = z
  .object({
    rules: serviceRulesSchema,
  })
  .strict();

export const acceptRulesRequestSchema = z
  .object({
    rulesVersion: z.string().trim().min(1),
  })
  .strict();

export const acceptRulesResponseSchema = authResponseSchema;

export type ServiceRules = z.infer<typeof serviceRulesSchema>;
export type ServiceRulesResponse = z.infer<typeof serviceRulesResponseSchema>;
export type AcceptRulesRequest = z.infer<typeof acceptRulesRequestSchema>;
export type AcceptRulesResponse = z.infer<typeof acceptRulesResponseSchema>;
