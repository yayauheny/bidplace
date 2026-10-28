import { ApiErrorCode } from '@bidplace/contracts';
import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { AppException } from '../errors/app.exception';
import { parseBody, parseQuery } from './index';

const requestSchema = z.object({
  title: z.string().trim().min(1),
  limit: z.coerce.number().int().default(20),
});

describe('parseBody and parseQuery', () => {
  it('applies transforms and defaults for body and query input', () => {
    expect(parseBody(requestSchema, { title: '  Предмет  ' })).toEqual({
      title: 'Предмет',
      limit: 20,
    });
    expect(parseQuery(requestSchema, { title: 'Предмет', limit: '4' })).toEqual({
      title: 'Предмет',
      limit: 4,
    });
  });

  it('rejects invalid body and query input with the same validation envelope', () => {
    for (const parse of [parseBody, parseQuery]) {
      try {
        parse(requestSchema, { title: '   ' });
        throw new Error('expected validation failure');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        const exception = error as AppException;
        expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(exception.getResponse()).toEqual({
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Request validation failed',
          details: {
            formErrors: [],
            fieldErrors: {
              title: ['String must contain at least 1 character(s)'],
            },
          },
        });
      }
    }
  });
});
