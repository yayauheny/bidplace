import { describe, expect, it } from 'vitest';

import {
  publicAuthorCte,
  publicAuthorOrderBy,
} from './sellers-catalog.query';

describe('publicAuthorOrderBy', () => {
  it('orders added authors by profile creation time, not latest work', () => {
    expect(publicAuthorOrderBy('added')).toBe(
      'filtered."created_at" DESC, filtered."id" ASC',
    );
    expect(publicAuthorOrderBy('added')).not.toContain('latest_product_at');
  });

  it('orders names alphabetically with a deterministic id tie-breaker', () => {
    expect(publicAuthorOrderBy('name')).toBe(
      'filtered."full_name" ASC, filtered."id" ASC',
    );
  });
});

describe('publicAuthorCte', () => {
  it('projects author created_at for added sorting', () => {
    const sql = publicAuthorCte(
      { page: 1, limit: 20, sort: 'added' },
      { requireCity: true },
    );
    expect(sql.strings.join(' ')).toContain('author."created_at"');
    expect(sql.strings.join(' ')).not.toContain('latest_product_at');
  });
});
