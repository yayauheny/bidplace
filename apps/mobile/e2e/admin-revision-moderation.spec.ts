import { mkdirSync } from 'node:fs';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { e2eApiBaseURL } from './support/e2e-env';
import { authenticatedPage } from './support/auth-session';
import {
  createRevisionModerationFixture,
  type RevisionImage,
} from './support/revision-moderation-fixture';

async function expectDecoded(
  locator: Locator,
  sizes: Array<{ width: number; height: number }>,
) {
  await expect(locator).toHaveCount(sizes.length);
  await expect
    .poll(async () =>
      locator.evaluateAll((nodes) =>
        nodes.map((node) => {
          const image =
            node instanceof HTMLImageElement ? node : node.querySelector('img');
          if (
            !(image instanceof HTMLImageElement) ||
            !image.complete ||
            image.naturalWidth === 0
          ) {
            return null;
          }
          return { width: image.naturalWidth, height: image.naturalHeight };
        }),
      ),
    )
    .toEqual(sizes);
}

async function expectImageResponse(
  page: Page,
  path: string,
  status: number,
  bytes?: Buffer,
) {
  const response = await page.request.get(`${e2eApiBaseURL}${path}`);
  expect(response.status()).toBe(status);
  const body = Buffer.from(await response.body());
  if (bytes && status === 200) {
    expect(response.headers()['content-type']).toContain('image/png');
    expect(body).toEqual(bytes);
  } else if (bytes) {
    expect(body.equals(bytes)).toBe(false);
  }
}

test('admin reviews a pending seller revision without exposing it publicly', async ({
  browser,
}) => {
  mkdirSync('/private/tmp/bidplace-admin-ui-evidence',{recursive:true});
  const fixture = await createRevisionModerationFixture();
  const guest = await browser.newPage();
  await guest.goto(`/authors/${fixture.slug}`);
  await expect(guest.getByText(fixture.publishedName).first()).toBeVisible();
  await expect(guest.getByText(fixture.pendingName)).toHaveCount(0);
  await expect(
    guest.getByText(`Фото автора недоступно: ${fixture.publishedName}`),
  ).toHaveCount(0);
  await expectDecoded(
    guest.getByTestId('creator-avatar').getByRole('img', {
      name: `Фото автора ${fixture.publishedName}`,
    }),
    [fixture.publishedPhotoSize],
  );
  const publicBefore = await guest.request.get(
    `${e2eApiBaseURL}/api/sellers/${fixture.slug}/photo`,
  );
  expect(publicBefore.status()).toBe(200);
  expect(publicBefore.headers()['content-type']).toContain('image/png');
  expect(Buffer.from(await publicBefore.body())).toEqual(fixture.publishedPhoto);
  await expectPublishedAchievement(guest, fixture.publishedAchievement);
  await expectImageResponse(
    guest,
    `/api/author-achievements/${fixture.pendingAchievement.id}/image`,
    404,
    fixture.pendingAchievement.bytes,
  );
  await expect(guest.getByText(fixture.pendingAchievement.body)).toHaveCount(0);

  const { context: adminContext, page } = await authenticatedPage(
    browser,
    fixture.admin,
  );
  await page.setViewportSize({width:390,height:844});
  const revisionPhoto = page.waitForResponse((response) =>
    response.url().includes(`/revisions/${fixture.revisionId}/photo`),
  );
  await page.goto('/admin?section=authors');
  await page.getByLabel('Поиск в очереди').fill(fixture.pendingName);
  await page.getByRole('link', { name: `Проверить: ${fixture.pendingName}` }).click();
  await expect(page.getByText(fixture.pendingName).first()).toBeVisible();
  await expect(page.getByText('Сущность:').first()).toBeVisible();
  await expect(page.getByText('Редакция:').first()).toBeVisible();
  const revisionResponse = await revisionPhoto;
  expect(revisionResponse.status()).toBe(200);
  expect(revisionResponse.headers()['content-type']).toContain('image/png');
  expect(Buffer.from(await revisionResponse.body())).toEqual(fixture.pendingPhoto);
  await expect(page.getByText('Фото ревизии недоступно')).toHaveCount(0);
  await expectDecoded(
    page.getByRole('img', { name: `Фото автора ${fixture.pendingName}` }),
    [fixture.pendingPhotoSize],
  );
  await expect(page.getByText(fixture.pendingAchievement.body).first()).toBeVisible();
  await expect(page.getByText(fixture.publishedAchievement.body)).toHaveCount(0);
  await expect(page.getByText('Изображение достижения недоступно')).toHaveCount(0);
  await page.getByRole('img', { name: `Достижение: ${fixture.pendingAchievement.body}`, exact: true }).scrollIntoViewIfNeeded();
  await expectDecoded(page.getByRole('img', { name: `Достижение: ${fixture.pendingAchievement.body}`, exact: true }), [
    {
      width: fixture.pendingAchievement.width,
      height: fixture.pendingAchievement.height,
    },
  ]);
  await guest.reload();
  await expect(guest.getByText(fixture.publishedName).first()).toBeVisible();
  await expect(guest.getByText(fixture.pendingName)).toHaveCount(0);
  await expectDecoded(
    guest.getByTestId('creator-avatar').getByRole('img', {
      name: `Фото автора ${fixture.publishedName}`,
    }),
    [fixture.publishedPhotoSize],
  );

  await page.getByRole('button', { name: 'Одобрить', exact: true }).click();
  await page.screenshot({path:`/private/tmp/bidplace-admin-ui-evidence/confirm-${test.info().project.name}-${fixture.publicId}.png`});
  await page.getByRole('button', { name: 'Подтвердить решение' }).click();
  await expect(page.getByText('Решение принято.', {exact:false})).toBeVisible();

  await guest.reload();
  await expect(guest.getByText(fixture.pendingName).first()).toBeVisible();
  await expect(
    guest.getByText(`Фото автора недоступно: ${fixture.pendingName}`),
  ).toHaveCount(0);
  await expectDecoded(
    guest.getByTestId('creator-avatar').getByRole('img', {
      name: `Фото автора ${fixture.pendingName}`,
    }),
    [fixture.pendingPhotoSize],
  );
  const publicAfter = await guest.request.get(
    `${e2eApiBaseURL}/api/sellers/${fixture.slug}/photo`,
  );
  expect(publicAfter.status()).toBe(200);
  expect(publicAfter.headers()['content-type']).toContain('image/png');
  expect(Buffer.from(await publicAfter.body())).toEqual(fixture.pendingPhoto);
  await expectPublishedAchievement(guest, fixture.pendingAchievement);
  await guest.close();
  await adminContext.close();
});

test('admin reviews a pending product revision without exposing its gallery publicly', async ({
  browser,
}) => {
  mkdirSync('/private/tmp/bidplace-admin-ui-evidence',{recursive:true});
  const fixture = await createRevisionModerationFixture();
  const guest = await browser.newPage();
  await guest.goto(`/product/${fixture.publicId}`);
  await expect(guest.getByText(fixture.publishedTitle).first()).toBeVisible();
  await expect(guest.getByText(fixture.pendingTitle)).toHaveCount(0);
  await expect(guest.getByText('Изображение недоступно')).toHaveCount(0);
  await expectGallery(guest, fixture.publishedTitle, fixture.publishedGallery);
  const before = await guest.request.get(
    `${e2eApiBaseURL}/api/works/${fixture.publicId}`,
  );
  expect(before.status()).toBe(200);
  const beforeBody = (await before.json()) as {
    work: {
      title: string;
      categoryId: string;
      images: Array<{ id: string; width: number | null; height: number | null }>;
    };
  };
  expect(beforeBody.work.title).toBe(fixture.publishedTitle);
  expect(imageIdentity(beforeBody.work.images)).toEqual(
    imageIdentity(fixture.publishedGallery),
  );
  await expectImageResponse(
    guest,
    `/api/images/${fixture.publishedImageId}`,
    200,
    fixture.publishedGallery[0].bytes,
  );
  await expectImageResponse(
    guest,
    `/api/images/${fixture.pendingOnlyImageId}`,
    404,
    fixture.pendingGallery[0].bytes,
  );

  const { context: adminContext, page } = await authenticatedPage(
    browser,
    fixture.admin,
  );
  await page.setViewportSize({width:390,height:844});
  await page.goto('/admin');
  await page.getByLabel('Поиск в очереди').fill(fixture.pendingTitle);
  await page.getByRole('link', { name: `Проверить: ${fixture.pendingTitle}` }).click();
  await expect(page.getByText(fixture.pendingTitle).first()).toBeVisible();
  await expect(page.getByText(`Категория: ${fixture.pendingCategoryName}`, { exact: true })).toBeVisible();
  await expect(page.getByText(fixture.publishedCategoryName, {exact:true})).toHaveCount(0);
  await expect(page.getByTestId('admin-moderation-detail').getByText(fixture.publishedTitle, {exact:true})).toHaveCount(0);
  await expect(
    page.getByText(`Изображение недоступно: ${fixture.pendingTitle}`),
  ).toHaveCount(0);
  await expectDecoded(
    page.getByTestId('admin-moderation-detail').getByTestId('work-gallery-media').getByRole('img'),
    fixture.pendingGallery.map((image) => ({
      width: image.width,
      height: image.height,
    })),
  );

  const evidence = '/private/tmp/bidplace-admin-ui-evidence';
  mkdirSync(evidence,{recursive:true});
  await page.screenshot({path:`${evidence}/work-mobile-${test.info().project.name}.png`});
  await page.getByRole('tab',{name:'Просмотр',exact:true}).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tabpanel',{name:'Изменения',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Изменения',exact:true}).click();
  await expect(page.getByText(`Было: ${fixture.publishedTitle}`,{exact:true})).toBeVisible();
  await page.screenshot({path:`${evidence}/changes-mobile-${test.info().project.name}.png`});
  await page.getByRole('tab',{name:'История',exact:true}).click();
  await page.screenshot({path:`${evidence}/history-mobile-${test.info().project.name}.png`});
  await page.getByRole('tab',{name:'Просмотр',exact:true}).click();
  await guest.reload();
  await expect(guest.getByText(fixture.publishedTitle).first()).toBeVisible();
  await expect(guest.getByText(fixture.pendingTitle)).toHaveCount(0);
  await expectGallery(guest, fixture.publishedTitle, fixture.publishedGallery);
  await expectImageResponse(
    guest,
    `/api/images/${fixture.pendingOnlyImageId}`,
    404,
    fixture.pendingGallery[0].bytes,
  );

  await page.getByRole('button', { name: 'Одобрить', exact: true }).click();
  await page.screenshot({path:`/private/tmp/bidplace-admin-ui-evidence/confirm-${test.info().project.name}-${fixture.publicId}.png`});
  await page.getByRole('button', { name: 'Подтвердить решение' }).click();
  await expect(page.getByText('Решение принято.', {exact:false})).toBeVisible();

  await guest.reload();
  await expect(guest.getByText(fixture.pendingTitle).first()).toBeVisible();
  await expect(guest.getByText('Изображение недоступно')).toHaveCount(0);
  await expectGallery(guest, fixture.pendingTitle, fixture.pendingGallery);
  const after = await guest.request.get(
    `${e2eApiBaseURL}/api/works/${fixture.publicId}`,
  );
  expect(after.status()).toBe(200);
  const afterBody = (await after.json()) as {
    work: {
      title: string;
      images: Array<{ id: string; width: number | null; height: number | null }>;
    };
  };
  expect(afterBody.work.title).toBe(fixture.pendingTitle);
  expect(imageIdentity(afterBody.work.images)).toEqual(
    imageIdentity(fixture.pendingGallery),
  );
  await expectImageResponse(
    guest,
    `/api/images/${fixture.pendingOnlyImageId}`,
    200,
    fixture.pendingGallery[0].bytes,
  );
  await expectImageResponse(
    guest,
    `/api/images/${fixture.pendingImageId}`,
    200,
    fixture.pendingGallery[1].bytes,
  );
  await guest.close();
  await adminContext.close();
});

async function expectPublishedAchievement(
  page: Page,
  achievement: {
    id: string;
    body: string;
    bytes: Buffer;
    width: number;
    height: number;
  },
) {
  await page.getByRole('tab', { name: 'Об авторе' }).click();
  await expect(page.getByText(achievement.body).first()).toBeVisible();
  await expect(page.getByText('Фотография недоступна')).toHaveCount(0);
  await expectDecoded(
    page
      .getByTestId('author-achievement-card')
      .filter({ hasText: achievement.body })
      .locator('img'),
    [{ width: achievement.width, height: achievement.height }],
  );
  await expectImageResponse(
    page,
    `/api/author-achievements/${achievement.id}/image`,
    200,
    achievement.bytes,
  );
}

function imageIdentity(
  images: Array<{ id: string; width: number | null; height: number | null }>,
) {
  return images.map((image) => ({
    id: image.id,
    width: image.width,
    height: image.height,
  }));
}

async function expectGallery(page: Page, title: string, images: RevisionImage[]) {
  const gallery = page.getByTestId('work-gallery').locator('[role="img"]');
  await expectDecoded(
    gallery,
    images.map((image) => ({ width: image.width, height: image.height })),
  );
  await expect(gallery).toHaveCount(images.length);
  expect(
    await gallery.evaluateAll((nodes) =>
      nodes.map((node) =>
        node instanceof HTMLImageElement ? node.alt : node.getAttribute('aria-label'),
      ),
    ),
  ).toEqual(
    images.map(
      (_image, index) => `${title}, фото ${index + 1} из ${images.length}`,
    ),
  );
}


test('mobile queue navigation preserves filters and supports compact states', async ({browser}) => {
  test.setTimeout(180_000);
  const fixture=await createRevisionModerationFixture();
  const {context,page}=await authenticatedPage(browser,fixture.admin);
  const evidence='/private/tmp/bidplace-admin-ui-evidence';mkdirSync(evidence,{recursive:true});
  const detailRequests:string[]=[];
  page.on('request',req=>{if(/\/api\/admin\/(products|seller-profiles)\/[0-9a-f-]{36}$/.test(req.url())) detailRequests.push(req.url());});
  try {
    await page.setViewportSize({width:390,height:844});
    await page.goto(`/admin?q=${encodeURIComponent(fixture.pendingTitle)}`);
    const choices=page.getByRole('toolbar',{name:'Раздел модерации'});
    await expect(choices.getByRole('button',{name:'Работы',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(choices.locator('[aria-controls]')).toHaveCount(0);
    const card=page.getByRole('link',{name:`Проверить: ${fixture.pendingTitle}`});
    await expect(card).toBeVisible();expect(detailRequests).toHaveLength(0);
    for(const width of [320,360,390,430]) {
      await page.setViewportSize({width,height:844});
      await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`${evidence}/queue-${test.info().project.name}-${width}.png`});
    }
    await page.setViewportSize({width:390,height:844});
    await card.click();await expect(page.getByTestId('admin-moderation-detail')).toBeVisible();
    const gallery=page.getByTestId('admin-moderation-detail').getByTestId('work-gallery');
    await expect(gallery.getByRole('button',{name:'Фото 2: выбрать'})).toBeVisible();
    const media=gallery.getByTestId('work-gallery-media');
    await expect.poll(async()=> (await media.boundingBox())?.height??0).toBeGreaterThan(300);
    await gallery.getByRole('button',{name:'Открыть фото 1',exact:true}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();
    await page.getByTestId('admin-moderation-detail').getByRole('button',{name:'Назад',exact:true}).click();
    await expect(card).toBeVisible();await expect(page.getByLabel('Поиск в очереди')).toHaveValue(fixture.pendingTitle);
    await page.getByLabel('Поиск в очереди').fill('no-results-fixture');
    await expect(page.getByText('Заявок по выбранным условиям нет.')).toBeVisible();
    await page.screenshot({path:`${evidence}/empty-${test.info().project.name}-390.png`});
    await page.route('**/api/admin/products/summary?**',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'fixture unavailable'})}));
    await page.reload();
    await expect(page.getByTestId('infrastructure-error-state-page')).toBeVisible();
    await page.screenshot({path:`${evidence}/error-${test.info().project.name}-390.png`});
    await page.unroute('**/api/admin/products/summary?**');
    await page.getByRole('button',{name:'Повторить',exact:true}).click();
    await expect(page.getByText('Заявок по выбранным условиям нет.')).toBeVisible();
    await page.goto(`/admin?section=authors&q=${encodeURIComponent(fixture.pendingName)}`);
    await page.getByRole('link',{name:`Проверить: ${fixture.pendingName}`}).click();
    await expect(page.getByRole('img',{name:`Фото автора ${fixture.pendingName}`})).toBeVisible();
    await page.screenshot({path:`${evidence}/author-${test.info().project.name}-390.png`});
  } finally {await context.close();}
});


test('moderation adapts after mobile acceptance without losing decision text', async ({browser}) => {
 const fixture=await createRevisionModerationFixture();const {context,page}=await authenticatedPage(browser,fixture.admin);
 const evidence='/private/tmp/bidplace-admin-ui-evidence';mkdirSync(evidence,{recursive:true});
 try {
  await page.setViewportSize({width:390,height:844});await page.goto(`/admin?q=${encodeURIComponent(fixture.pendingTitle)}`);
  await page.getByRole('link',{name:`Проверить: ${fixture.pendingTitle}`}).click();
  for(const width of [768,1024,1440,390]) {
   await page.setViewportSize({width,height:1000});
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const gallery=page.getByTestId('admin-moderation-detail').getByTestId('work-gallery');
   const box=await gallery.boundingBox();expect(box?.width).toBeLessThan(width);
   await page.screenshot({path:`${evidence}/work-adaptive-${test.info().project.name}-${width}.png`});
  }
  await page.getByRole('button',{name:'Исправления',exact:true}).click();await page.getByLabel('Причина решения').fill('Сохранённая причина при изменении окна');
  for(const width of [320,1440,390]) {await page.setViewportSize({width,height:844});await expect(page.getByLabel('Причина решения')).toHaveValue('Сохранённая причина при изменении окна');}
  await page.getByRole('button',{name:'Отмена',exact:true}).click();
  await page.getByRole('button',{name:'Исправления',exact:true}).click();await expect(page.getByLabel('Причина решения')).toHaveValue('Сохранённая причина при изменении окна');
 } finally {await context.close();}
});
