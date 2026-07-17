import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'bad_request',
  'validation_error',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  'internal_error',
]);

export const validationErrorDetailsSchema = z
  .object({
    formErrors: z.array(z.string()),
    fieldErrors: z.record(z.string(), z.array(z.string())),
  })
  .strict();

export const apiErrorResponseSchema = z
  .object({
    status: z.number().int().positive(),
    code: apiErrorCodeSchema,
    message: z.string().min(1),
    details: validationErrorDetailsSchema.optional(),
  })
  .strict();

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ValidationErrorDetails = z.infer<typeof validationErrorDetailsSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
