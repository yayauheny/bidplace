import type { ValidationErrorDetails } from '@bidplace/contracts';
import { BadRequestException } from '@nestjs/common';
import { type ZodError } from 'zod';

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

export function createValidationException(error: ZodError): BadRequestException {
  return new BadRequestException({
    code: 'validation_error',
    message: 'Request validation failed',
    details: toValidationErrorDetails(error),
  });
}
