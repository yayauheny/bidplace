import { describe, expect, it } from 'vitest';

import {
  portfolioProductContentSql,
  portfolioProductContentWhere,
} from './public-visibility';

describe('public product content visibility', () => {
  it('keeps creator condition and packaging optional in Prisma queries', () => {
    expect(portfolioProductContentWhere).not.toHaveProperty('condition');
    expect(portfolioProductContentWhere).not.toHaveProperty('packaging');
  });

  it('uses only required portfolio Work fields in SQL queries', () => {
    expect(portfolioProductContentSql.text).not.toContain('"condition"');
    expect(portfolioProductContentSql.text).not.toContain('"packaging"');
    expect(portfolioProductContentSql.text).not.toContain('"delivery_info"');
  });
});
