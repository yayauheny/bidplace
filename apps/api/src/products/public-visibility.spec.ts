import { describe, expect, it } from 'vitest';

import {
  publicProductContentSql,
  publicProductContentWhere,
} from './public-visibility';

describe('public product content visibility', () => {
  it('keeps creator condition and packaging optional in Prisma queries', () => {
    expect(publicProductContentWhere).not.toHaveProperty('condition');
    expect(publicProductContentWhere).not.toHaveProperty('packaging');
  });

  it('uses only required portfolio Work fields in SQL queries', () => {
    expect(publicProductContentSql.text).not.toContain('"condition"');
    expect(publicProductContentSql.text).not.toContain('"packaging"');
    expect(publicProductContentSql.text).not.toContain('"delivery_info"');
  });
});
