import argon2 from 'argon2';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prepares one dummy hash at startup and verifies every unknown password against it', async () => {
    const hash = vi.spyOn(argon2, 'hash');
    const verify = vi.spyOn(argon2, 'verify');
    const hasher = new PasswordHasherService();

    await hasher.onApplicationBootstrap();
    await hasher.onApplicationBootstrap();
    expect(hash).toHaveBeenCalledTimes(1);
    expect(hash).toHaveBeenCalledWith('bidplace-login-timing-dummy');

    const prepared = await hasher.dummyHash();
    expect(hash).toHaveBeenCalledTimes(1);
    await hasher.verify(prepared, 'first-unknown-password');
    await hasher.verify(await hasher.dummyHash(), 'later-unknown-password');
    expect(hash).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenNthCalledWith(1, prepared, 'first-unknown-password');
    expect(verify).toHaveBeenNthCalledWith(2, prepared, 'later-unknown-password');
  });
});
