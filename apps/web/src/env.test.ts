import { describe, expect, it } from 'vitest';

import { loadPublicEnv } from './env';

describe('loadPublicEnv', () => {
  it('rejects invalid public URLs instead of silently falling back', () => {
    expect(() =>
      loadPublicEnv({
        NEXT_PUBLIC_API_URL: 'not-a-url',
        NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: 'bidplace_bot',
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow();
  });
});
