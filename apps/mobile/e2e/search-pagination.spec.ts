import { expect, test } from '@playwright/test';

import {
  portfolioAuthorsResponseSchema,
  portfolioWorksResponseSchema,
} from '@bidplace/contracts';

import {
  createIsolatedAuthorsPaginationFixture,
  createIsolatedWorksPaginationFixture,
} from './support/e2e-fixtures';

const cases = [
  {
    name: 'works',
    tab: 'Работы',
    endpoint: '/api/works',
    limit: 12,
    total: 13,
    sort: 'newest',
    prefix: '/product/',
    create: async () => {
      const fixture = await createIsolatedWorksPaginationFixture();
      return {
        query: fixture.material,
        lastHref: `/product/${fixture.pageTwoPublicId}`,
        cleanup: fixture.cleanup,
      };
    },
    parse: (data: unknown) => {
      const result = portfolioWorksResponseSchema.parse(data);
      return {
        pagination: result.pagination,
        hrefs: result.works.map((item) => `/product/${item.work.publicId}`),
      };
    },
  },
  {
    name: 'authors',
    tab: 'Авторы',
    endpoint: '/api/authors',
    limit: 8,
    total: 9,
    sort: 'added',
    prefix: '/seller/',
    create: async () => {
      const fixture = await createIsolatedAuthorsPaginationFixture();
      return {
        query: fixture.searchQuery,
        lastHref: `/seller/${fixture.pageTwoSlug}`,
        cleanup: fixture.cleanup,
      };
    },
    parse: (data: unknown) => {
      const result = portfolioAuthorsResponseSchema.parse(data);
      return {
        pagination: result.pagination,
        hrefs: result.authors.map((item) => `/seller/${item.author.slug}`),
      };
    },
  },
];

for (const scenario of cases) {
  test(`Search ${scenario.name} loads the required second page without duplicates`, async ({
    page,
  }) => {
    const fixture = await scenario.create();
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/search');
      const overlay = page.getByTestId('search-overlay');
      await expect(overlay).toBeVisible();
      await overlay.getByRole('tab', { name: scenario.tab }).click();
      const responseForPage = (expectedPage: number) =>
        page.waitForResponse((response) => {
          const url = new URL(response.url());
          return (
            url.pathname === scenario.endpoint &&
            url.searchParams.get('q') === fixture.query &&
            (url.searchParams.get('page') ?? '1') === String(expectedPage) &&
            url.searchParams.get('sort') === scenario.sort &&
            response.ok()
          );
        });
      const firstResponse = responseForPage(1);
      await overlay.getByTestId('search-overlay-query').fill(fixture.query);
      const first = scenario.parse(await (await firstResponse).json());
      expect(first.pagination).toEqual({
        page: 1,
        limit: scenario.limit,
        total: scenario.total,
      });
      expect(first.hrefs).toHaveLength(scenario.limit);
      expect(first.hrefs).not.toContain(fixture.lastHref);
      const links = overlay.locator(`a[href^="${scenario.prefix}"]`);
      await expect(links).toHaveCount(scenario.limit);
      const secondResponse = responseForPage(2);
      await overlay.getByRole('button', { name: 'Показать ещё' }).click();
      const second = scenario.parse(await (await secondResponse).json());
      expect(second.pagination).toEqual({
        page: 2,
        limit: scenario.limit,
        total: scenario.total,
      });
      expect(second.hrefs).toEqual([fixture.lastHref]);
      await expect(links).toHaveCount(scenario.total);
      const hrefs = await links.evaluateAll((items) =>
        items.map((item) => item.getAttribute('href')),
      );
      expect(new Set(hrefs).size).toBe(scenario.total);
      expect(hrefs.filter((href) => href === fixture.lastHref)).toHaveLength(1);
      await expect(
        overlay.getByRole('button', { name: 'Показать ещё' }),
      ).toHaveCount(0);
      await expect(overlay.getByTestId('search-overlay-query')).toHaveValue(
        fixture.query,
      );
    } finally {
      await fixture.cleanup();
    }
  });
}
