import { describe, expect, it } from 'vitest';

import {
  publicAuthorCityWhere,
  publicCatalogProductWhere,
  publicProductContentSql,
  publicProductContentWhere,
} from './public-visibility';

describe('public product content visibility', () => {
  it('keeps creator condition and packaging optional in Prisma queries', () => {
    expect(publicProductContentWhere).not.toHaveProperty('condition');
    expect(publicProductContentWhere).not.toHaveProperty('packaging');
  });

  it('uses only required portfolio Work fields in SQL queries', async () => {
    expect(publicProductContentSql.text).not.toContain('"condition"');
    expect(publicProductContentSql.text).not.toContain('"packaging"');
    expect(publicProductContentSql.text).not.toContain('"delivery_info"');
    expect(publicProductContentSql.text).toContain('product_revision_images');
    expect(publicProductContentSql.text).toContain('published_at');
    expect(publicProductContentSql.text).toContain('BTRIM(sp."city")');
    expect(publicProductContentSql.text).toContain('BTRIM(pr."title")');
  });

  it('requires a non-empty author city on public catalog rows', () => {
    expect(publicCatalogProductWhere.sellerProfile).toEqual({
      status: 'APPROVED',
      city: publicAuthorCityWhere,
    });
  });
});
