import {
  ApiErrorCode,
  type ValidationErrorDetails,
} from '@bidplace/contracts';
import { HttpStatus } from '@nestjs/common';
import { type ZodError } from 'zod';

import { AppException } from '../errors/app.exception';

function toValidationErrorDetails(error: ZodError): ValidationErrorDetails {
  const flattenedError = error.flatten();
  const fieldErrors = Object.fromEntries(
    Object.entries(flattenedError.fieldErrors).flatMap(([field, messages]) =>
      messages ? [[field, messages]] : [],
    ),
  );

  return {
    formErrors: flattenedError.formErrors,
    fieldErrors,
  };
}

export function createValidationException(error: ZodError): AppException {
  return new AppException({
    status: HttpStatus.BAD_REQUEST,
    code: ApiErrorCode.VALIDATION_ERROR,
    message: 'Request validation failed',
    details: toValidationErrorDetails(error),
  });
}
