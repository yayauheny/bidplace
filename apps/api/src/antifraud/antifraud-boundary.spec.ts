import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as antifraud from './index';

describe('antifraud public boundary', () => {
  it('keeps auth operations behind the facade instead of exporting callable internals', () => {
    for (const operation of ['lockAbuseUser', 'otpCodeHash']) {
      expect(Reflect.has(antifraud, operation)).toBe(false);
    }
    // Notification delivery classifies SMTP failures without an AntifraudService
    // instance, and feature code cannot import antifraud internals.
    expect(Reflect.has(antifraud, 'classifyMailFailure')).toBe(true);
  });

  it('rejects internal implementation imports from another feature while allowing the public entrypoint', () => {
    const results = JSON.parse(execFileSync(process.execPath, ['-e', `
      const { ESLint } = require('eslint');
      const eslint = new ESLint({ overrideConfig: { parserOptions: { project: null } } });
      Promise.all([
        '../antifraud/auth/auth-abuse.service',
        '../antifraud/antifraud.service',
        '../antifraud',
      ].map(source => eslint.lintText('import { AntifraudService } from ' + JSON.stringify(source) + ';\\nexport { AntifraudService };', {
        filePath: 'src/auth/antifraud-boundary-fixture.ts',
      }))).then(results => process.stdout.write(JSON.stringify(results.map(([result]) =>
        result.messages.filter(message => message.ruleId === 'no-restricted-imports').length
      ))));
    `], { cwd: resolve(__dirname, '../..'), encoding: 'utf8' })) as number[];

    expect(results).toEqual([1, 1, 0]);
  });
});
