import { describe, expect, it } from 'vitest';

import { classifyMailFailure } from './mail-outcome';

describe('classifyMailFailure', () => {
  it('treats a local recipient validation error as a guaranteed reject', () => {
    expect(
      classifyMailFailure(new Error('Mail recipient must be a single email address')),
    ).toBe('rejected');
  });

  it('treats an SMTP response code as a guaranteed reject even when command is CONN', () => {
    expect(classifyMailFailure({ command: 'CONN', responseCode: 550 })).toBe('rejected');
    expect(classifyMailFailure({ responseCode: 400 })).toBe('rejected');
    expect(classifyMailFailure({ responseCode: '599' })).toBe('rejected');
  });

  it('treats CONN without a response code as unknown', () => {
    expect(classifyMailFailure({ command: 'CONN' })).toBe('unknown');
  });

  it('treats timeouts and generic errors as unknown', () => {
    const timeout = new Error('socket hang up');
    (timeout as Error & { code?: string }).code = 'ETIMEDOUT';
    expect(classifyMailFailure(timeout)).toBe('unknown');
    expect(classifyMailFailure(new Error('delivery failed'))).toBe('unknown');
    expect(classifyMailFailure({ responseCode: 200 })).toBe('unknown');
  });
});
