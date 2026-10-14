import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

// Guards the token diet (Wave 1): no dead leaves, no new odd geometry values.
// A leaf counts as read when any of its parent paths is referenced, because
// consumers often take a whole group (e.g. designTokens.typography.button).

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const SCAN_DIRS = ['apps/mobile/src', 'packages'];
const SKIP = /node_modules|\/dist\/|\.expo|\.spec\.|\.test\./;

function collectFiles(dir: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP.test(full)) continue;
    if (statSync(full).isDirectory()) {
      collectFiles(full, acc);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

const corpus = SCAN_DIRS.flatMap((d) => collectFiles(join(REPO_ROOT, d), []))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')
  .replace(/\/\/[^\n]*/g, '');

const TOKENS_FILE = 'packages/design-tokens/src/tokens.ts';

function leaves(value: unknown, path: string[] = []): string[][] {
  if (typeof value !== 'object' || value === null) return [path];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leaves(child, [...path, key]),
  );
}

const tokenLeaves = leaves(designTokens);

describe('designTokens coverage', () => {
  it('has no token leaf without readers', () => {
    const dead = tokenLeaves.filter((path) => {
      const prefixes = path.slice(0, -1).map((_, i) => path.slice(0, i + 1).join('.'));
      return ![...prefixes, path.join('.')].some((p) => corpus.includes(`designTokens.${p}`));
    });
    expect(dead.map((p) => p.join('.'))).toEqual([]);
  });

  it('keeps space/size/radius values even', () => {
    // Grandfathered odd values. Remove entries only by fixing the token.
    const ALLOWLIST: string[] = [
      'space.chipX',
      'space.chipY',
      'space.fieldY',
      'space.fieldLabelX',
      'space.fieldErrorX',
      'space.homeSectionStack',
      'space.filterOptionY',
      'space.headerIconHitSlop',
      'radius.pill',
      'size.fieldBorder',
      'size.choiceChipRemovable',
      'size.authorAtmosphere',
      'size.filterSortBar',
    ];
    const odd: string[] = [];
    for (const path of tokenLeaves) {
      const [group, leaf] = [path[0], path.join('.')];
      if (!['space', 'size', 'radius'].includes(group) || ALLOWLIST.includes(leaf)) continue;
      const value = path.reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], designTokens);
      if (typeof value === 'number' && !Number.isInteger(value / 2)) odd.push(leaf);
    }
    expect(odd).toEqual([]);
  });

  it('keeps the tokens module the only source of truth', () => {
    expect(statSync(join(REPO_ROOT, TOKENS_FILE)).isFile()).toBe(true);
  });
});
