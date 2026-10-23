import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { AnalyticsFoundationResponse } from '@bidplace/contracts';
import { authenticatedPage } from './support/auth-session';
import {
  createAdminModerationFixture,
  createSellerFixture,
} from './support/e2e-fixtures';
import { e2eApiBaseURL } from './support/e2e-env';

const evidence = '/private/tmp/bidplace-analytics-ui-evidence';
mkdirSync(evidence, { recursive: true });
function response(
  from: string,
  to: string,
  empty = false,
): AnalyticsFoundationResponse {
  const dates: string[] = [];
  for (let day = Date.parse(from); day < Date.parse(to); day += 86_400_000)
    dates.push(new Date(day).toISOString().slice(0, 10));
  return {
    from,
    to,
    environment: 'local',
    serverCollectionEnabled: !empty ? false : true,
    coverage: {
      firstVisitAt: empty ? null : `${dates[0]}T12:00:00.000Z`,
      firstAuthorPublicationAt: null,
      legacyExcluded: true,
    },
    product: {
      visitors: empty ? 0 : 3,
      sessions: empty ? 0 : 2,
      views: empty ? 0 : 7,
      firstAuthors: 0,
      firstWorks: 0,
    },
    growth: dates.map((date, index) => ({
      date,
      visitors: empty ? 0 : index % 3,
      sessions: empty ? 0 : index % 2,
      views: empty ? 0 : index,
      registrations: empty ? 0 : 1,
      firstAuthors: 0,
      firstWorks: 0,
    })),
    operational: {
      registrations: empty ? 0 : 5,
      currentAuthors: 0,
      currentWorks: 0,
      pendingAuthors: 1,
      pendingWorks: 2,
      stuckAuthors: 0,
      stuckWorks: 1,
      unknownAuthorSubmissionTime: 1,
      unknownWorkSubmissionTime: 0,
      unknownAuthorFirstPublication: 0,
    },
    acquisition: {
      visitors: empty ? 0 : 3,
      registrations: empty ? 0 : 1,
      rate: empty ? null : 1 / 3,
      mature: false,
      bySource: empty
        ? []
        : [{ source: 'direct', visitors: 3, registrations: 1 }],
    },
  };
}

test('mobile analytics uses protected activity reads, one metric and valid UTC periods', async ({
  browser,
  browserName,
}) => {
  const fixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, fixture.admin);
  try {
    const direct = await context.request.get(
      `${e2eApiBaseURL}/api/admin/analytics/foundation?from=2026-10-01T00:00:00.000Z&to=2026-10-02T00:00:00.000Z&includeActivity=true`,
    );
    expect(direct.status()).toBe(200);
    expect(await direct.json()).toMatchObject({
      serverCollectionEnabled: false,
      growth: [{ sessions: expect.any(Number) }],
    });
    const requests: URL[] = [];
    await page.route('**/api/admin/analytics/foundation?**', async (route) => {
      const url = new URL(route.request().url());
      requests.push(url);
      await route.fulfill({
        json: response(
          url.searchParams.get('from')!,
          url.searchParams.get('to')!,
        ),
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/analytics');
    const screen = page.getByTestId('admin-analytics-detail');
    await expect(
      screen.getByText('Когортная конверсия за 30 дней', { exact: true }),
    ).toBeAttached();
    expect(requests.at(-1)?.searchParams.get('includeActivity')).toBe('true');
    await expect(screen.getByText(/Серверный сбор: выключен/)).toBeVisible();
    await expect(
      screen.getByText(/Клиентский web-сборщик этой сборки: выключен/),
    ).toBeVisible();
    await expect(screen.getByText(/Когорта незрелая/)).toBeAttached();
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `${evidence}/overview-${browserName}-${width}.png`,
      });
    }
    const chart = screen.getByTestId('analytics-chart');
    await chart.scrollIntoViewIfNeeded();
    await screen.getByRole('tab', { name: 'Сессии', exact: true }).click();
    await expect(chart).toHaveAttribute('aria-label', /Сессии по дням/);
    await page.screenshot({
      path: `${evidence}/growth-${browserName}-390.png`,
    });
    await screen.getByRole('tab', { name: 'Период', exact: true }).click();
    const beforeInvalid = requests.length;
    await screen.getByLabel('Начало (ГГГГ-ММ-ДД)').fill('2026-02-30');
    await screen
      .getByLabel('Конец включительно (ГГГГ-ММ-ДД)')
      .fill('2026-03-01');
    await expect(screen.getByText(/Укажите существующие даты/)).toBeVisible();
    expect(requests.length).toBe(beforeInvalid);
    await screen.getByLabel('Начало (ГГГГ-ММ-ДД)').fill('2026-03-01');
    await expect
      .poll(() => requests.at(-1)?.searchParams.get('to'))
      .toBe('2026-03-02T00:00:00.000Z');
    await expect(
      screen.getByText('Когортная конверсия за 30 дней', { exact: true }),
    ).toBeAttached();
  } finally {
    await context.close();
  }
});

test('analytics distinguishes empty, unavailable collection status and HTTP failure, then retries', async ({
  browser,
  browserName,
}) => {
  const fixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, fixture.admin);
  try {
    let state: 'empty' | 'legacy' | 'offline' = 'empty';
    await page.route('**/api/admin/analytics/foundation?**', async (route) => {
      if (state === 'offline')
        return route.fulfill({
          status: 503,
          json: { message: 'Fixture unavailable' },
        });
      const url = new URL(route.request().url());
      const data = response(
        url.searchParams.get('from')!,
        url.searchParams.get('to')!,
        true,
      );
      if (state === 'legacy') {
        delete data.serverCollectionEnabled;
        data.growth.forEach((day) => delete day.sessions);
      }
      await route.fulfill({ json: data });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/analytics');
    const screen = page.getByTestId('admin-analytics-detail');
    await expect(screen.getByText(/Серверный сбор: разрешён/)).toBeVisible();
    await expect(screen.getByText(/исторических web-данных нет/)).toBeVisible();
    await screen
      .getByText('В выбранном периоде наблюдений этой метрики нет.')
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${evidence}/empty-${browserName}-390.png` });
    state = 'legacy';
    await page.reload();
    await expect(
      screen.getByText(/Серверный сбор: статус недоступен/),
    ).toBeVisible();
    await screen.getByRole('tab', { name: 'Сессии', exact: true }).click();
    await expect(
      screen.getByText('Дневные значения недоступны.'),
    ).toBeVisible();
    state = 'offline';
    await page.reload();
    await expect(
      screen.getByTestId('infrastructure-error-state-page'),
    ).toBeVisible({ timeout: 12_000 });
    await page.screenshot({ path: `${evidence}/error-${browserName}-390.png` });
    state = 'empty';
    await screen
      .getByRole('button', { name: 'Повторить', exact: true })
      .click();
    await expect(screen.getByText(/Серверный сбор: разрешён/)).toBeVisible();
  } finally {
    await context.close();
  }
});

test('ordinary users cannot read analytics or open its administrative screen', async ({
  browser,
  request,
}) => {
  const path =
    '/api/admin/analytics/foundation?from=2026-10-01T00:00:00.000Z&to=2026-10-02T00:00:00.000Z&includeActivity=true';
  expect((await request.get(`${e2eApiBaseURL}${path}`)).status()).toBe(401);
  const { seller } = await createSellerFixture({ status: 'APPROVED' });
  const { context, page } = await authenticatedPage(browser, seller);
  try {
    expect(
      (await context.request.get(`${e2eApiBaseURL}${path}`)).status(),
    ).toBe(403);
    await page.goto('/analytics');
    await expect(page.getByTestId('admin-analytics-detail')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('analytics adapts after mobile acceptance and preserves custom dates and metric on resize', async ({
  browser,
  browserName,
}) => {
  const fixture = await createAdminModerationFixture();
  const { context, page } = await authenticatedPage(browser, fixture.admin);
  try {
    await page.route('**/api/admin/analytics/foundation?**', async (route) => {
      const url = new URL(route.request().url());
      const data = response(
        url.searchParams.get('from')!,
        url.searchParams.get('to')!,
      );
      data.acquisition.bySource.push({
        source: 'campaign'.repeat(15),
        visitors: 1,
        registrations: 0,
      });
      await route.fulfill({ json: data });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/analytics');
    const screen = page.getByTestId('admin-analytics-detail');
    await screen.getByRole('tab', { name: 'Период', exact: true }).click();
    await screen.getByLabel('Начало (ГГГГ-ММ-ДД)').fill('2026-10-01');
    await screen
      .getByLabel('Конец включительно (ГГГГ-ММ-ДД)')
      .fill('2026-10-07');
    await expect(screen.getByTestId('analytics-chart')).toBeAttached();
    await screen.getByRole('tab', { name: 'Сессии', exact: true }).click();
    for (const width of [768, 1024, 1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(screen.getByLabel('Начало (ГГГГ-ММ-ДД)')).toHaveValue(
        '2026-10-01',
      );
      await expect(
        screen.getByLabel('Конец включительно (ГГГГ-ММ-ДД)'),
      ).toHaveValue('2026-10-07');
      await expect(screen.getByTestId('analytics-chart')).toHaveAttribute(
        'aria-label',
        /Сессии по дням/,
      );
      await screen
        .getByText('Прямой переход', { exact: true })
        .scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await screen.getByTestId('analytics-chart').scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${evidence}/adaptive-growth-${browserName}-${width}.png`,
      });
      await screen
        .getByText('Аналитика', { exact: true })
        .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${evidence}/adaptive-overview-${browserName}-${width}.png`,
      });
    }
  } finally {
    await context.close();
  }
});
