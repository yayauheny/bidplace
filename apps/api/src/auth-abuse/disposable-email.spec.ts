import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { DisposableEmailList } from './disposable-email';

describe('DisposableEmailList', () => {
  const list = new DisposableEmailList();

  it('blocks a pinned disposable domain and a parent suffix', () => {
    expect(list.contains('person@mailinator.com')).toBe(true);
    expect(list.contains('Person@Foo.Mailinator.com')).toBe(true);
  });

  it('allows an ordinary mailbox', () => {
    expect(list.contains('person@gmail.com')).toBe(false);
  });

  it('loads the packaged list from the built module in a clean directory', () => {
    const built = resolve(__dirname, '../../dist/auth-abuse/disposable-email.js');
    expect(existsSync(built)).toBe(true);
    const cwd = mkdtempSync(join(tmpdir(), 'bidplace-disposable-'));
    execFileSync(
      process.execPath,
      [
        '-e',
        `const { DisposableEmailList } = require(${JSON.stringify(built)});
         const list = new DisposableEmailList();
         if (!list.contains('a@mailinator.com')) process.exit(2);
         if (list.contains('a@gmail.com')) process.exit(3);`,
      ],
      { cwd, env: { PATH: process.env.PATH }, stdio: 'pipe' },
    );
  });
});
