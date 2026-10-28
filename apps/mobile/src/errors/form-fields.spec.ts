import { ApiErrorCode } from '@bidplace/contracts';
import { describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';

import { readFormFailure, slugTakenMessage } from './form-fields';

const grammar =
  'Используйте маленькие латинские буквы и цифры. Между ними можно поставить дефис или подчёркивание.';

describe('form field failures', () => {
  it('maps every known field error and keeps an unknown key as a form message', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const failure = readFormFailure(
      new ApiClientError('Request validation failed', {
        kind: 'validation',
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
        requestId: 'req-1',
        details: {
          formErrors: ['Проверьте форму'],
          fieldErrors: {
            slug: [grammar],
            city: ['Укажите город'],
            secret: ['do not render this key as a field'],
          },
        },
      }),
      ['slug', 'city', 'fullName'],
    );

    expect(failure.disposition).toBe('fields');
    expect(failure.fields).toEqual({ slug: grammar, city: 'Укажите город' });
    expect(failure.formMessage).toContain('Проверьте форму');
    expect(failure.formMessage).toContain('Проверьте введённые данные');
    expect(JSON.stringify(failure)).not.toContain('do not render');
    expect(info).toHaveBeenCalledWith('[form-validation]', {
      requestId: 'req-1',
      unknownFields: ['secret'],
    });
    info.mockRestore();
  });

  it('keeps a taken nickname distinct from an existing profile', () => {
    expect(
      readFormFailure(
        new ApiClientError('Seller profile slug is already taken', {
          kind: 'conflict',
          status: 409,
          code: ApiErrorCode.CONFLICT,
          details: { reason: 'slug_taken' },
        }),
        ['slug', 'fullName'],
      ),
    ).toMatchObject({ disposition: 'fields', fields: { slug: slugTakenMessage } });

    expect(
      readFormFailure(
        new ApiClientError('Seller profile already exists', {
          kind: 'conflict',
          status: 409,
          code: ApiErrorCode.CONFLICT,
          details: { reason: 'profile_exists' },
        }),
        ['slug'],
      ),
    ).toMatchObject({
      disposition: 'form',
      fields: {},
      formMessage: 'Заявка автора уже создана.',
    });

    const ambiguous = readFormFailure(
      new ApiClientError('Seller profile already exists or slug is already taken', {
        kind: 'conflict',
        status: 409,
        code: ApiErrorCode.CONFLICT,
      }),
      ['slug'],
    );
    expect(ambiguous.fields).toEqual({});
    expect(ambiguous.formMessage).not.toContain('никнейм');
  });

  it('does not treat network or server failures as field errors', () => {
    expect(
      readFormFailure(new ApiClientError('offline', { kind: 'network', status: 0 }), ['slug'])
        .disposition,
    ).toBe('passthrough');
    expect(
      readFormFailure(
        new ApiClientError('Internal server error', {
          kind: 'server',
          status: 500,
          code: ApiErrorCode.INTERNAL_ERROR,
          requestId: 'req-500',
        }),
        ['email', 'password'],
      ).disposition,
    ).toBe('passthrough');
    expect(
      readFormFailure(
        new ApiClientError('Invalid credentials', {
          kind: 'unauthorized',
          status: 401,
          code: ApiErrorCode.UNAUTHORIZED,
        }),
        ['email', 'password'],
      ).disposition,
    ).toBe('passthrough');
  });
});
