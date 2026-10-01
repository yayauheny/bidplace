import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createEnvInput, loadEnvFile, parseEnv } from './index';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function writeSyntheticEnv(contents: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'bidplace-config-'));
  directories.push(directory);
  const filePath = join(directory, 'synthetic.env');
  writeFileSync(filePath, contents);
  return filePath;
}

describe('loadEnvFile', () => {
  it('returns an empty object when the file is absent', () => {
    const directory = mkdtempSync(join(tmpdir(), 'bidplace-config-'));
    directories.push(directory);

    expect(loadEnvFile(join(directory, 'missing.env'))).toEqual({});
  });

  it('returns an empty object for an empty file', () => {
    expect(loadEnvFile(writeSyntheticEnv(''))).toEqual({});
  });

  it('parses comments, quotes, CRLF, empty values, and duplicate keys', () => {
    const filePath = writeSyntheticEnv(
      [
        '# comment',
        '',
        'FOO=bar',
        'QUOTED="bar baz"',
        "SINGLE='bar baz'",
        'EMPTY=',
        'DUP=one',
        'DUP=two',
        'SPACED=" hello "',
      ].join('\r\n'),
    );

    expect(loadEnvFile(filePath)).toEqual({
      FOO: 'bar',
      QUOTED: 'bar baz',
      SINGLE: 'bar baz',
      EMPTY: '',
      DUP: 'two',
      SPACED: ' hello ',
    });
  });

  it('uses Node parseEnv syntax for comments, export, escapes, and a leading BOM', () => {
    const filePath = writeSyntheticEnv(
      [
        'export EXPORTED=yes',
        'INLINE=bar # comment',
        'HASHED=bar#baz',
        'LEADING=#bar',
        'QUOTED_HASH="bar # stays"',
        'AFTER_QUOTE="bar" # comment',
        String.raw`ESCAPED="hello\nworld"`,
        String.raw`LITERAL='hello\nworld'`,
        `WRAPPED="'inner'"`,
        '\uFEFFBOM=value',
      ].join('\n'),
    );

    expect(loadEnvFile(filePath)).toEqual({
      EXPORTED: 'yes',
      INLINE: 'bar',
      HASHED: 'bar',
      LEADING: '',
      QUOTED_HASH: 'bar # stays',
      AFTER_QUOTE: 'bar',
      ESCAPED: 'hello\nworld',
      LITERAL: String.raw`hello\nworld`,
      WRAPPED: "'inner'",
      '\uFEFFBOM': 'value',
    });
  });
});

describe('createEnvInput', () => {
  it('lets the explicit env override file values', () => {
    const filePath = writeSyntheticEnv(
      ['SHARED=from-file', 'FILE_ONLY=file', 'EMPTY_IN_FILE='].join('\n'),
    );

    expect(
      createEnvInput(filePath, {
        SHARED: 'from-env',
        ENV_ONLY: 'env',
        EMPTY_IN_FILE: '',
      }),
    ).toMatchObject({
      SHARED: 'from-env',
      FILE_ONLY: 'file',
      ENV_ONLY: 'env',
      EMPTY_IN_FILE: '',
    });
  });

  it('keeps explicit env values when the file is absent', () => {
    const directory = mkdtempSync(join(tmpdir(), 'bidplace-config-'));
    directories.push(directory);

    expect(
      createEnvInput(join(directory, 'missing.env'), {
        ONLY: 'env',
      }),
    ).toEqual({
      ONLY: 'env',
    });
  });
});

describe('parseEnv', () => {
  it('validates the supplied env with the caller schema', () => {
    const schema = z.object({
      PORT: z.coerce.number().int().positive(),
    });

    expect(parseEnv(schema, { PORT: '3001' })).toEqual({ PORT: 3001 });
  });
});
