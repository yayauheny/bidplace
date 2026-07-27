import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import { publicProductDetailResponseSchema } from '@bidplace/contracts';

const execFileAsync = promisify(execFile);
const e2e = resolve(__dirname);
const databaseUrl =
  'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public';
const sellerEmail = 'seller@e2e.test';
const sellerPassword = 'password123';
const sellerDisplayName = 'seller';
const sellerPhone = '+375290000004';
const sellerSlug = 'e2e-seller';
const sellerFullName = 'E2E Seller';
const sellerCountry = 'BY';
const sellerSocialLink = 'https://example.com/e2e-seller';
const sellerDescription = 'E2E seller profile';
const sellerHandoffContactType = 'TELEGRAM';
const sellerHandoffContactValue = '@e2eseller';
const sellerHandoffInitiator = 'BUYER_CONTACTS_SELLER';
const imageFixturePath = resolve(e2e, 'fixtures', 'profile-photo.png');

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type BaseState = {
  buyer: { email: string };
  outsider: { email: string };
  admin: { email: string };
  category: { slug: string };
  seller?: { email: string };
  product?: { id: string; publicId: string };
  listing?: { id: string };
  order?: { publicId: string };
};

let state: BaseState;

async function readOtp(): Promise<string | null> {
  try {
    const lines = (await readFile(resolve(e2e, '.email.jsonl'), 'utf8'))
      .trim()
      .split('\n');
    return JSON.parse(lines.at(-1) ?? '{}').code ?? null;
  } catch {
    return null;
  }
}

async function chooseFile(page: Page, buttonName: string) {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: buttonName }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(imageFixturePath);
}

async function signIn(page: Page, email: string, redirectTo: string) {
  await page.goto(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(sellerPassword);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/auth/login') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Войти' }).click();
  expect((await loginResponse).ok()).toBeTruthy();
  await page.waitForURL(new RegExp(`${escapeRegExp(redirectTo)}$`));
}

async function registerSeller(page: Page) {
  await page.goto(`/register?redirectTo=${encodeURIComponent('/profile')}`);
  await page.getByLabel('Имя').fill(sellerDisplayName);
  await page.getByLabel('Email').fill(sellerEmail);
  await page.getByLabel('Телефон').fill(sellerPhone);
  await page.getByLabel('Пароль').fill(sellerPassword);
  const registerResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/auth/register') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  expect((await registerResponse).ok()).toBeTruthy();
  await page.waitForURL(/\/profile$/);
}

async function submitSellerProfile(page: Page) {
  await page.getByLabel('URL-slug').fill(sellerSlug);
  await page.getByLabel('Имя или название').fill(sellerFullName);
  await page.getByLabel('Страна').fill(sellerCountry);
  await page.getByLabel('Публичная ссылка').fill(sellerSocialLink);
  await page.getByLabel('Короткое описание').fill(sellerDescription);
  await page.getByLabel('Способ передачи').fill(sellerHandoffContactType);
  await page.getByLabel('Контакт для передачи').fill(sellerHandoffContactValue);
  await page.getByLabel('Кто начинает контакт').fill(sellerHandoffInitiator);
  await chooseFile(page, 'Добавить фото');

  const profileResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/seller/profile') &&
      response.request().method() === 'POST',
  );

  await page.getByRole('button', { name: 'Создать профиль' }).click();
  expect((await profileResponse).ok()).toBeTruthy();
  await expect(page.getByText('На модерации')).toBeVisible();
}

async function createProduct(page: Page) {
  await page.goto('/products/new');
  await page.getByRole('button', { name: 'E2E art' }).click();
  await page.getByLabel('Название').fill('E2E Product');
  await page.getByLabel('История предмета').fill('Real API product');
  await page.getByLabel('Уникальность или тираж').fill('One');
  await page.getByLabel('Происхождение').fill('E2E');
  await page.getByLabel('Техника').fill('Mixed media');
  await page.getByLabel('Материалы').fill('Paper, ink');
  await page.getByLabel('Размеры').fill('30x40');
  await page.getByLabel('Вес').fill('0.5');
  await page.getByLabel('Год').fill('2026');
  await page.getByLabel('Город').fill('Minsk');
  await page.getByLabel('Передача или доставка').fill('Pickup');

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/products') &&
      response.request().method() === 'POST',
  );

  await page.getByRole('button', { name: 'Сохранить черновик' }).click();
  const productResponse = await createResponse;
  expect(productResponse.ok()).toBeTruthy();
  const { product } = await productResponse.json();
  expect(product.id).toBeTruthy();
  expect(product.publicId).toBeTruthy();
  await page.waitForURL(new RegExp(`/products/${product.id}$`));

  await chooseFile(page, 'Добавить изображения');
  await expect(page.getByText('1/10 изображений')).toBeVisible();

  const submitResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/products/${product.id}/submit`) &&
      response.request().method() === 'POST',
  );

  await page.getByRole('button', { name: 'Отправить на модерацию' }).click();
  expect((await submitResponse).ok()).toBeTruthy();
  await expect(page.getByText('PENDING_REVIEW')).toBeVisible();

  return { id: product.id as string, publicId: product.publicId as string };
}

async function createAndScheduleListing(
  page: Page,
  productId: string,
  productPublicId: string,
) {
  await page.getByRole('button', { name: 'Создать аукцион' }).click();
  await expect(page.getByText('Новое размещение')).toBeVisible();

  const startsAt = new Date(Date.now() + 15_000).toISOString();
  const endsAt = new Date(Date.now() + 315_000).toISOString();

  await page.getByLabel('Начало').fill(startsAt);
  await page.getByLabel('Окончание').fill(endsAt);
  await page.getByLabel('Стартовая цена, BYN').fill('10');

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/products/${productId}/listings`) &&
      response.request().method() === 'POST',
  );

  await page.getByRole('button', { name: 'Создать размещение' }).click();
  const listingResponse = await createResponse;
  expect(listingResponse.ok()).toBeTruthy();
  const { listing } = await listingResponse.json();
  expect(listing.id).toBeTruthy();

  const scheduleResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/listings/${listing.id}`) &&
      response.request().method() === 'PATCH',
  );

  await page.getByRole('button', { name: 'Запланировать размещение' }).click();
  expect((await scheduleResponse).ok()).toBeTruthy();
  await expect(
    page.getByRole('button', { name: 'Открыть страницу аукциона' }),
  ).toBeVisible();

  return { id: listing.id as string, productPublicId };
}

async function waitForListingLive(
  request: Pick<APIRequestContext, 'get'>,
  publicId: string,
) {
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `http://127.0.0.1:3001/api/products/${publicId}`,
        );
        expect(response.ok()).toBeTruthy();
        const payload = await response.json();
        return payload.listing?.status ?? null;
      },
      { timeout: 90_000, intervals: [1_000, 3_000] },
    )
    .toBe('LIVE');
}

test.describe.serial('closed pilot', () => {
  test.beforeAll(async () => {
    state = JSON.parse(await readFile(resolve(e2e, '.state.json'), 'utf8'));
  });

  test('seller onboarding, moderation, listing scheduling, buyer bid, and handoff', async ({
    browser,
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const sellerContext = await browser.newContext({
      baseURL: 'http://127.0.0.1:8081',
    });
    const sellerPage = await sellerContext.newPage();

    await registerSeller(sellerPage);
    await submitSellerProfile(sellerPage);

    state = { ...state, seller: { email: sellerEmail } };
    await writeFile(resolve(e2e, '.state.json'), JSON.stringify(state));

    const adminContext = await browser.newContext({
      baseURL: 'http://127.0.0.1:8081',
    });
    const adminPage = await adminContext.newPage();
    await signIn(adminPage, state.admin.email, '/admin');
    await expect(adminPage.getByText(sellerFullName)).toBeVisible();
    await adminPage.getByRole('button', { name: 'Одобрить' }).first().click();
    await expect(adminPage.getByText('APPROVED')).toBeVisible();

    await sellerPage.reload();
    await expect(
      sellerPage.getByRole('button', { name: 'Создать лот' }),
    ).toBeVisible();
    await sellerPage.getByRole('button', { name: 'Создать лот' }).click();

    const createdProduct = await createProduct(sellerPage);
    state = { ...state, product: createdProduct };
    await writeFile(resolve(e2e, '.state.json'), JSON.stringify(state));

    await adminPage.reload();
    await expect(adminPage.getByText('E2E Product')).toBeVisible();
    await adminPage.getByRole('button', { name: 'Одобрить' }).nth(1).click();
    await expect(adminPage.getByText('APPROVED')).toBeVisible();

    await sellerPage.reload();
    await expect(
      sellerPage.getByRole('button', { name: 'Создать аукцион' }),
    ).toBeVisible();
    const createdListing = await createAndScheduleListing(
      sellerPage,
      createdProduct.id,
      createdProduct.publicId,
    );
    state = { ...state, listing: { id: createdListing.id } };
    await writeFile(resolve(e2e, '.state.json'), JSON.stringify(state));

    await adminPage.close();
    await sellerContext.close();
    await adminContext.close();

    await waitForListingLive(request, createdProduct.publicId);

    const productResponse = await request.get(
      `http://127.0.0.1:3001/api/products/${createdProduct.publicId}`,
    );
    expect(productResponse.ok()).toBeTruthy();
    expect(
      publicProductDetailResponseSchema.safeParse(await productResponse.json())
        .success,
    ).toBeTruthy();

    await signIn(
      page,
      state.buyer.email,
      `/product/${createdProduct.publicId}`,
    );
    await expect(page.getByText('E2E Product')).toBeVisible();
    await expect(page.locator('body')).toContainText(
      /Текущая цена\s*10,00\s+BYN/,
    );
    await expect(page.getByText('Unexpected text node')).toHaveCount(0);

    await expect(page.getByText('Мы отправим код на ваш email.')).toBeVisible();
    const otpResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/auth/email/request') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Отправить код' }).click();
    expect((await otpResponse).status()).toBe(201);

    await expect.poll(readOtp).not.toBeNull();
    const code = (await readOtp())!;
    await page.getByPlaceholder('000000').fill(code);
    await page.getByRole('button', { name: 'Подтвердить email' }).click();
    await expect(
      page.getByRole('button', { name: 'Принять правила' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Принять правила' }).click();
    await expect(page.getByLabel('Ваша ставка, BYN')).toBeVisible();
    await page.getByLabel('Ваша ставка, BYN').fill('11');
    await page.getByRole('button', { name: 'Сделать ставку' }).click();
    await expect(page.getByText('Подтвердите ставку')).toBeVisible();
    await expect(page.getByText('Ставка необратима.')).toBeVisible();
    await expect(page.getByText('Unexpected text node')).toHaveCount(0);
    await page.getByRole('button', { name: 'Подтвердить ставку' }).click();
    await expect(page.locator('body')).toContainText(
      /Текущая цена\s*11,00\s+BYN/,
    );

    await execFileAsync(process.execPath, [resolve(e2e, 'close-listing.mjs')], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        E2E_DATABASE_URL: databaseUrl,
      },
    });
    state = JSON.parse(await readFile(resolve(e2e, '.state.json'), 'utf8'));

    await page.goto('/me/activity');
    await expect(page.getByText('E2E Product')).toBeVisible();
    await page.getByRole('button', { name: 'Открыть заказ' }).click();
    await expect(
      page.getByText(`Заказ ${state.order!.publicId}`),
    ).toBeVisible();

    await page.goto(`/order/${state.order!.publicId}`);
    await expect(page.getByText(sellerHandoffContactValue)).toBeVisible();
    await expect(page.getByText(state.buyer.email)).toHaveCount(0);

    const sellerLoginContext = await browser.newContext({
      baseURL: 'http://127.0.0.1:8081',
    });
    const sellerLoginPage = await sellerLoginContext.newPage();
    await signIn(
      sellerLoginPage,
      sellerEmail,
      `/order/${state.order!.publicId}`,
    );
    await expect(sellerLoginPage.getByText(state.buyer.email)).toBeVisible();
    await sellerLoginPage
      .getByRole('button', { name: 'Отметить контакт' })
      .click();
    await expect(sellerLoginPage.getByText('CONTACTED')).toBeVisible();
    await sellerLoginPage
      .getByRole('button', { name: 'Передача завершена' })
      .click();
    await expect(sellerLoginPage.getByText('COMPLETED')).toBeVisible();
    await sellerLoginContext.close();
  });

  test('outsider cannot open another buyer order and admin can inspect it', async ({
    browser,
    request,
  }) => {
    const adminLogin = await request.post(
      'http://127.0.0.1:3001/api/auth/login',
      {
        data: { email: state.admin.email, password: sellerPassword },
      },
    );
    expect(adminLogin.ok()).toBeTruthy();
    const permittedOrder = await request.get(
      `http://127.0.0.1:3001/api/orders/${state.order!.publicId}`,
      { headers: { cookie: adminLogin.headers()['set-cookie'] } },
    );
    expect(permittedOrder.ok()).toBeTruthy();

    const context = await browser.newContext({
      baseURL: 'http://127.0.0.1:8081',
    });
    const outsiderPage = await context.newPage();
    await signIn(
      outsiderPage,
      state.outsider.email,
      `/order/${state.order!.publicId}`,
    );
    await expect(outsiderPage.getByText('Заказ недоступен')).toBeVisible();
    await context.close();
  });

  test('legacy auction route is absent', async ({ page }) => {
    await page.goto('/auctions/legacy');
    await expect(page.getByText('Unmatched Route')).toBeVisible();
  });
});
