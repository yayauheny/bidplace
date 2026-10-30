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

  PRODUCT_STATE_CONFLICT: 'PRODUCT_STATE_CONFLICT',
  PRODUCT_IN_SALE: 'PRODUCT_IN_SALE',
  BID_TOO_LOW: 'BID_TOO_LOW',
  BUYER_BLOCKED: 'BUYER_BLOCKED',
  LISTING_NOT_OPEN: 'LISTING_NOT_OPEN',
  LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
  LISTING_CHANGED: 'LISTING_CHANGED',
  SELF_BID_FORBIDDEN: 'SELF_BID_FORBIDDEN',
  ADMIN_BID_FORBIDDEN: 'ADMIN_BID_FORBIDDEN',
  BID_ALREADY_LEADING: 'BID_ALREADY_LEADING',
  BID_AMOUNT_INVALID: 'BID_AMOUNT_INVALID',
  BUYER_ORDER_LIMIT: 'BUYER_ORDER_LIMIT',
  BUYER_CONTACTS_REQUIRED: 'BUYER_CONTACTS_REQUIRED',
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  ORDER_TRANSITION_NOT_ALLOWED: 'ORDER_TRANSITION_NOT_ALLOWED',
  PRODUCT_ALREADY_SOLD: 'PRODUCT_ALREADY_SOLD',
  NO_NEXT_BIDDER: 'NO_NEXT_BIDDER',
  DEAL_RULES_NOT_ACCEPTED: 'DEAL_RULES_NOT_ACCEPTED',
  EMAIL_VERIFICATION_REQUIRED: 'EMAIL_VERIFICATION_REQUIRED',
  RULES_ACCEPTANCE_REQUIRED: 'RULES_ACCEPTANCE_REQUIRED',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  PASSWORD_RESET_INVALID: 'PASSWORD_RESET_INVALID',
  TURNSTILE_REQUIRED: 'TURNSTILE_REQUIRED',
  TURNSTILE_FAILED: 'TURNSTILE_FAILED',
  TURNSTILE_UNAVAILABLE: 'TURNSTILE_UNAVAILABLE',
  DISPOSABLE_EMAIL: 'DISPOSABLE_EMAIL',
  MAIL_COOLDOWN: 'MAIL_COOLDOWN',
  MAIL_QUOTA: 'MAIL_QUOTA',
  MAIL_BUDGET: 'MAIL_BUDGET',
  MAIL_REJECTED: 'MAIL_REJECTED',
  EMAIL_LOGIN_REJECTED: 'EMAIL_LOGIN_REJECTED',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_PAUSED: 'OTP_PAUSED',
  LOGIN_PAUSED: 'LOGIN_PAUSED',
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
  ApiErrorCode.PRODUCT_STATE_CONFLICT,
  ApiErrorCode.PRODUCT_IN_SALE,
  ApiErrorCode.BID_TOO_LOW,
  ApiErrorCode.BUYER_BLOCKED,
  ApiErrorCode.LISTING_NOT_OPEN,
  ApiErrorCode.LISTING_NOT_FOUND,
  ApiErrorCode.LISTING_CHANGED,
  ApiErrorCode.SELF_BID_FORBIDDEN,
  ApiErrorCode.ADMIN_BID_FORBIDDEN,
  ApiErrorCode.BID_ALREADY_LEADING,
  ApiErrorCode.BID_AMOUNT_INVALID,
  ApiErrorCode.BUYER_ORDER_LIMIT,
  ApiErrorCode.BUYER_CONTACTS_REQUIRED,
  ApiErrorCode.IDEMPOTENCY_KEY_REUSED,
  ApiErrorCode.ORDER_TRANSITION_NOT_ALLOWED,
  ApiErrorCode.PRODUCT_ALREADY_SOLD,
  ApiErrorCode.NO_NEXT_BIDDER,
  ApiErrorCode.DEAL_RULES_NOT_ACCEPTED,
  ApiErrorCode.EMAIL_VERIFICATION_REQUIRED,
  ApiErrorCode.RULES_ACCEPTANCE_REQUIRED,
  ApiErrorCode.IDEMPOTENCY_KEY_REQUIRED,
  ApiErrorCode.IDEMPOTENCY_CONFLICT,
  ApiErrorCode.PASSWORD_RESET_INVALID,
  ApiErrorCode.TURNSTILE_REQUIRED,
  ApiErrorCode.TURNSTILE_FAILED,
  ApiErrorCode.TURNSTILE_UNAVAILABLE,
  ApiErrorCode.DISPOSABLE_EMAIL,
  ApiErrorCode.MAIL_COOLDOWN,
  ApiErrorCode.MAIL_QUOTA,
  ApiErrorCode.MAIL_BUDGET,
  ApiErrorCode.MAIL_REJECTED,
  ApiErrorCode.EMAIL_LOGIN_REJECTED,
  ApiErrorCode.OTP_INVALID,
  ApiErrorCode.OTP_EXPIRED,
  ApiErrorCode.OTP_PAUSED,
  ApiErrorCode.LOGIN_PAUSED,
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

/**
 * Public HTTP error contract. `code` is the stable client branch.
 * `message` is diagnostic copy for logs, not UI copy.
 */
export const apiErrorResponseSchema = z
  .object({
    status: z.number().int().positive(),
    code: apiErrorCodeSchema,
    message: z.string().min(1),
    details: z.unknown().optional(),
    requestId: z.string().min(1).optional(),
  })
  .strict();

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ValidationErrorDetails = z.infer<
  typeof validationErrorDetailsSchema
>;
export type BidTooLowDetails = z.infer<typeof bidTooLowDetailsSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
