import { ApiClientError } from '@bidplace/api-client';
import {
  ApiErrorCode,
  sellerProfileConflictDetailsSchema,
  validationErrorDetailsSchema,
} from '@bidplace/contracts';
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

export const formValidationFallbackMessage =
  'Проверьте введённые данные и попробуйте снова.';

export const slugTakenMessage = 'Этот никнейм уже занят. Выберите другой.';

export const profileExistsMessage = 'Заявка автора уже создана.';

const infrastructureKinds = new Set([
  'network',
  'server',
  'unexpected_response',
  'unauthorized',
  'forbidden',
  'rate_limited',
  'not_found',
]);

export type FormFailure = {
  disposition: 'fields' | 'form' | 'passthrough';
  fields: Record<string, string>;
  formMessage: string | null;
};

export function readFormFailure(
  error: unknown,
  knownFields: readonly string[],
): FormFailure {
  if (!(error instanceof ApiClientError) || infrastructureKinds.has(error.kind)) {
    return { disposition: 'passthrough', fields: {}, formMessage: null };
  }

  if (error.code === ApiErrorCode.CONFLICT) {
    const parsed = sellerProfileConflictDetailsSchema.safeParse(error.details);
    if (parsed.success && parsed.data.reason === 'slug_taken' && knownFields.includes('slug')) {
      return { disposition: 'fields', fields: { slug: slugTakenMessage }, formMessage: null };
    }
    if (parsed.success && parsed.data.reason === 'profile_exists') {
      return { disposition: 'form', fields: {}, formMessage: profileExistsMessage };
    }
    return {
      disposition: 'form',
      fields: {},
      formMessage: 'Операцию не удалось выполнить из-за конфликта данных.',
    };
  }

  if (error.kind !== 'validation' && error.code !== ApiErrorCode.VALIDATION_ERROR) {
    return { disposition: 'passthrough', fields: {}, formMessage: null };
  }

  const details = validationErrorDetailsSchema.safeParse(error.details);
  if (!details.success) {
    console.info('[form-validation]', {
      requestId: error.requestId,
      code: error.code,
      status: error.status,
    });
    return { disposition: 'form', fields: {}, formMessage: formValidationFallbackMessage };
  }

  const fields: Record<string, string> = {};
  const unknownFields: string[] = [];
  for (const [key, messages] of Object.entries(details.data.fieldErrors)) {
    const text = messages.map((message) => message.trim()).filter(Boolean).join(' ');
    if (!text) continue;
    if (knownFields.includes(key)) fields[key] = text;
    else unknownFields.push(key);
  }

  const formParts = details.data.formErrors.map((message) => message.trim()).filter(Boolean);
  if (unknownFields.length > 0) {
    console.info('[form-validation]', {
      requestId: error.requestId,
      unknownFields,
    });
    formParts.push(formValidationFallbackMessage);
  }

  const formMessage = formParts.join(' ') || null;
  if (Object.keys(fields).length > 0) {
    return { disposition: 'fields', fields, formMessage };
  }

  return {
    disposition: 'form',
    fields: {},
    formMessage: formMessage ?? formValidationFallbackMessage,
  };
}

export function applyFormFailure<T extends FieldValues>(
  form: UseFormReturn<T>,
  failure: FormFailure,
  order: readonly FieldPath<T>[],
) {
  for (const name of order) {
    const message = failure.fields[name];
    if (!message) continue;
    form.setError(name, { type: 'server', message });
  }
  const first = order.find((name) => failure.fields[name]);
  if (first) form.setFocus(first);
}

export function focusFirstFormError<T extends FieldValues>(
  form: UseFormReturn<T>,
  order: readonly FieldPath<T>[],
) {
  const first = order.find((name) => form.getFieldState(name).error);
  if (first) form.setFocus(first);
}
