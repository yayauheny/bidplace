import { expect, type Page } from '@playwright/test';
import {
  meResponseSchema,
  sellerProfileResponseSchema,
  portfolioAuthorDetailResponseSchema,
  portfolioCabinetWorksResponseSchema,
} from '@bidplace/contracts';

const stamp = '2026-10-20T00:00:00.000Z';
const userId = '11111111-1111-4111-8111-111111111111';
const authorId = '22222222-2222-4222-8222-222222222222';
export const presentationName = 'Илья Васильев';
export const presentationSlug = 'vex';

export async function installAccountPresentation(
  page: Page,
  options: {
    author?: boolean;
    longName?: boolean;
    unverified?: boolean;
    works?: number;
  } = {},
) {
  const author = options.author ?? false;
  const fullName = options.longName
    ? 'Илья Васильев — автор длинного названия творческой мастерской'
    : presentationName;
  const session = meResponseSchema.parse({
    user: {
      id: userId,
      email: 'presentation@example.com',
      phone: null,
      emailVerifiedAt: options.unverified ? null : stamp,
      phoneVerifiedAt: null,
      acceptedRulesVersion: null,
      displayName: fullName,
      slug: presentationSlug,
      role: 'user',
      status: 'active',
      createdAt: stamp,
      updatedAt: stamp,
    },
  });
  const publicAuthor = {
    id: authorId,
    slug: presentationSlug,
    fullName,
    country: 'Беларусь',
    city: null,
    discipline: null,
    directionCategoryIds: [],
    directions: [],
    practice: null,
    biography: null,
    profilePhotoUrl: '/api/sellers/vex/photo',
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    publicEmail: null,
    shortDescription: 'Тестовая публичная биография',
  };
  const profile = sellerProfileResponseSchema.parse({
    sellerProfile: {
      ...publicAuthor,
      userId,
      sellerType: 'creator',
      socialLink: null,
      fullName: 'Неопубликованная редакция',
      shortDescription: null,
      handoffContactType: null,
      handoffContactValue: null,
      handoffInitiator: null,
      status: 'APPROVED',
      applicationStage: null,
      createdAt: stamp,
      updatedAt: stamp,
    },
    editingRevision: null,
  });
  const authorDetail = portfolioAuthorDetailResponseSchema.parse({
    author: { ...publicAuthor, achievements: [], sharePath: '/authors/vex' },
    works: [],
    pagination: { page: 1, limit: 20, total: 0 },
  });
  const works = portfolioCabinetWorksResponseSchema.parse({
    works: Array.from({ length: options.works ?? 4 }, (_, i) => ({
      id: `33333333-3333-4333-8333-${String(i).padStart(12, '0')}`,
      publicId: `work00000${String(i).padStart(2, '0')}`,
      title:
        i === 0
          ? 'Название работы с переносом на следующую строку'
          : `Работа ${i + 1}`,
      status: 'APPROVED',
      editingRevisionStatus: null,
      updatedAt: stamp,
      moderationMessage: null,
      coverImage: null,
    })),
    pagination: { page: 1, limit: 20, total: options.works ?? 4 },
  });
  const requests: Record<string, number> = {};
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    requests[path] = (requests[path] ?? 0) + 1;
    if (path === '/api/auth/me') return route.fulfill({ json: session });
    if (path === '/api/seller/profile')
      return author
        ? route.fulfill({ json: profile })
        : route.fulfill({
            status: 404,
            json: { message: 'Seller profile not found' },
          });
    if (path === '/api/authors/vex')
      return author
        ? route.fulfill({ json: authorDetail })
        : route.fulfill({ status: 404, json: { message: 'Author not found' } });
    if (path === '/api/author/cabinet/works')
      return route.fulfill({ json: works });
    if (path === '/api/sellers/vex/photo')
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#E0E0E0"/></svg>',
      });
    if (path === '/api/categories')
      return route.fulfill({ json: { categories: [] } });
    if (path === '/api/portfolio/home')
      return route.fulfill({
        json: { curatorSelection: null, newWorks: [], newAuthors: [] },
      });
    if (path === '/api/auth/logout')
      return route.fulfill({ json: { ok: true } });
    if (path === '/api/analytics/events') return route.fulfill({ status: 204 });
    return route.fulfill({
      status: 404,
      json: { message: 'Fixture route not found' },
    });
  });
  return requests;
}

export async function openPresentationAccount(page: Page) {
  await page.goto('/account');
  await expect(
    page
      .getByTestId('account-identity')
      .getByText(presentationName, { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
