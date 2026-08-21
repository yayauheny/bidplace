import { z } from 'zod';

/**
 * HTTP-category codes remain the default when a service throws a plain Nest
 * exception. Business codes are added only for client-distinguishable cases.
 */
export const ApiErrorCode = {
  BAD_REQUEST: 'bad_request',
  VALIDATION_ERROR: 'validation_error',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  RATE_LIMITED: 'rate_limited',
  INTERNAL_ERROR: 'internal_error',

  BID_TOO_LOW: 'BID_TOO_LOW',
  LISTING_NOT_OPEN: 'LISTING_NOT_OPEN',
  LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
  LISTING_CHANGED: 'LISTING_CHANGED',
  SELF_BID_FORBIDDEN: 'SELF_BID_FORBIDDEN',
  ADMIN_BID_FORBIDDEN: 'ADMIN_BID_FORBIDDEN',
  EMAIL_VERIFICATION_REQUIRED: 'EMAIL_VERIFICATION_REQUIRED',
  RULES_ACCEPTANCE_REQUIRED: 'RULES_ACCEPTANCE_REQUIRED',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  PASSWORD_RESET_INVALID: 'PASSWORD_RESET_INVALID',
} as const;

export const apiErrorCodeSchema = z.enum([
  ApiErrorCode.BAD_REQUEST,
  ApiErrorCode.VALIDATION_ERROR,
  ApiErrorCode.UNAUTHORIZED,
  ApiErrorCode.FORBIDDEN,
  ApiErrorCode.NOT_FOUND,
  ApiErrorCode.CONFLICT,
  ApiErrorCode.RATE_LIMITED,
  ApiErrorCode.INTERNAL_ERROR,
  ApiErrorCode.BID_TOO_LOW,
  ApiErrorCode.LISTING_NOT_OPEN,
  ApiErrorCode.LISTING_NOT_FOUND,
  ApiErrorCode.LISTING_CHANGED,
  ApiErrorCode.SELF_BID_FORBIDDEN,
  ApiErrorCode.ADMIN_BID_FORBIDDEN,
  ApiErrorCode.EMAIL_VERIFICATION_REQUIRED,
  ApiErrorCode.RULES_ACCEPTANCE_REQUIRED,
  ApiErrorCode.IDEMPOTENCY_KEY_REQUIRED,
  ApiErrorCode.IDEMPOTENCY_CONFLICT,
  ApiErrorCode.PASSWORD_RESET_INVALID,
]);

export const validationErrorDetailsSchema = z
  .object({
    formErrors: z.array(z.string()),
    fieldErrors: z.record(z.string(), z.array(z.string())),
  })
  .strict();

export const bidTooLowDetailsSchema = z
  .object({
    minimumBid: z.string().min(1),
  })
  .strict();

export const apiErrorResponseSchema = z
  .object({
    status: z.number().int().positive(),
    code: apiErrorCodeSchema,
    message: z.string().min(1),
    details: z.unknown().optional(),
  })
  .strict();

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ValidationErrorDetails = z.infer<typeof validationErrorDetailsSchema>;
export type BidTooLowDetails = z.infer<typeof bidTooLowDetailsSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
