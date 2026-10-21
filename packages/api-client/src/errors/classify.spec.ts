import { describe, expect, it } from 'vitest';

import { classifyApiError } from './classify';

describe('HTTP upload error classification', () => {
  it('recognizes a 413 response without an API JSON body', () => {
    expect(classifyApiError(413, null)).toBe('bad_request');
  });
});
