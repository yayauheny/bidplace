import { expect, test } from '@playwright/test';

import {
  createIsolatedAuthorsPaginationFixture,
  createIsolatedWorksPaginationFixture,
} from './support/e2e-fixtures';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
});

test('isolated works category and material require a second page', async ({
  page,
}) => {
  const fixture = await createIsolatedWorksPaginationFixture();
  try {
    const firstPageResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === '/api/works' &&
        url.searchParams.get('category') === fixture.categoryId &&
        url.searchParams.get('materials') === fixture.material &&
        (url.searchParams.get('page') ?? '1') === '1' &&
        response.ok()
      );
    });
    await page.goto(
      `/works?category=${fixture.categoryId}&material=${encodeURIComponent(fixture.material)}`,
    );
    const firstPage = (await (await firstPageResponse).json()) as {
      works: Array<{ work: { publicId: string } }>;
      pagination: { page: number; limit: number; total: number };
    };
    expect(firstPage.pagination).toEqual({ page: 1, limit: 12, total: 13 });
    expect(firstPage.works).toHaveLength(12);
    expect(
      firstPage.works.some(
        (item) => item.work.publicId === fixture.pageTwoPublicId,
      ),
    ).toBe(false);

    const workLinks = page.locator('a[href^="/product/"]');
    await expect(workLinks).toHaveCount(12);
    await expect(
      page.locator(`a[href="/product/${fixture.pageTwoPublicId}"]`),
    ).toHaveCount(0);

    const secondPageResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === '/api/works' &&
        url.searchParams.get('page') === '2' &&
        url.searchParams.get('category') === fixture.categoryId &&
        url.searchParams.get('materials') === fixture.material &&
        url.searchParams.get('sort') === 'newest' &&
        response.ok()
      );
    });
    await page.getByRole('button', { name: 'Показать ещё' }).click();
    const secondPage = (await (await secondPageResponse).json()) as {
      works: Array<{ work: { publicId: string } }>;
    };
    expect(secondPage.works.map((item) => item.work.publicId)).toEqual([
      fixture.pageTwoPublicId,
    ]);
    await expect(workLinks).toHaveCount(13);
    const hrefs = await workLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    );
    expect(hrefs).toHaveLength(13);
    expect(new Set(hrefs).size).toBe(13);
    expect(
      hrefs.filter((href) => href === `/product/${fixture.pageTwoPublicId}`),
    ).toHaveLength(1);
    await expect(page.getByRole('button', { name: 'Показать ещё' })).toHaveCount(
      0,
    );
  } finally {
    await fixture.cleanup();
  }
});

test('isolated authors tag and city require a second page', async ({ page }) => {
  const fixture = await createIsolatedAuthorsPaginationFixture();
  try {
    const firstPageResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === '/api/authors' &&
        url.searchParams.get('tag') === fixture.tag &&
        url.searchParams.get('city') === fixture.city &&
        (url.searchParams.get('page') ?? '1') === '1' &&
        response.ok()
      );
    });
    await page.goto(
      `/authors?tag=${encodeURIComponent(fixture.tag)}&city=${encodeURIComponent(fixture.city)}`,
    );
    const firstPage = (await (await firstPageResponse).json()) as {
      authors: Array<{ author: { slug: string } }>;
      pagination: { page: number; limit: number; total: number };
    };
    expect(firstPage.pagination).toEqual({ page: 1, limit: 8, total: 9 });
    expect(firstPage.authors).toHaveLength(8);
    expect(
      firstPage.authors.some((item) => item.author.slug === fixture.pageTwoSlug),
    ).toBe(false);

    const authorLinks = page.locator('a[href^="/seller/"]');
    await expect(authorLinks).toHaveCount(8);
    await expect(
      page.locator(`a[href="/seller/${fixture.pageTwoSlug}"]`),
    ).toHaveCount(0);

    const secondPageResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === '/api/authors' &&
        url.searchParams.get('page') === '2' &&
        url.searchParams.get('tag') === fixture.tag &&
        url.searchParams.get('city') === fixture.city &&
        url.searchParams.get('sort') === 'added' &&
        response.ok()
      );
    });
    await page.getByRole('button', { name: 'Показать ещё' }).click();
    const secondPage = (await (await secondPageResponse).json()) as {
      authors: Array<{ author: { slug: string } }>;
    };
    expect(secondPage.authors.map((item) => item.author.slug)).toEqual([
      fixture.pageTwoSlug,
    ]);
    await expect(authorLinks).toHaveCount(9);
    const hrefs = await authorLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    );
    expect(hrefs).toHaveLength(9);
    expect(new Set(hrefs).size).toBe(9);
    expect(
      hrefs.filter((href) => href === `/seller/${fixture.pageTwoSlug}`),
    ).toHaveLength(1);
    await expect(page.getByRole('button', { name: 'Показать ещё' })).toHaveCount(
      0,
    );
  } finally {
    await fixture.cleanup();
  }
});
