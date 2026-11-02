const path = require('node:path');
const { expect, test } = require('@playwright/test');

const fixture = (orientation) =>
  path.resolve(__dirname, `../fixtures/exif/canonical-${orientation}.jpg`);

async function confirmAvatar(page, orientation, options = {}) {
  const input = page.getByLabel('source-photo');
  await input.evaluate((element) => {
    element.value = '';
  });
  await input.setInputFiles(fixture(orientation));
  await expect(page.getByTestId('status')).toHaveText('ready');
  await expect
    .poll(() => page.getByTestId('edit').textContent())
    .not.toBe('{"rotate":0,"flipHorizontal":false,"flipVertical":false,"crop":null}');
  if (options.shift) {
    const before = await page.getByTestId('edit').textContent();
    const surface = page.getByRole('group', { name: /Кадрирование/ });
    await surface.focus();
    await surface.press('Shift+ArrowRight');
    await surface.press('Shift+ArrowDown');
    await expect.poll(() => page.getByTestId('edit').textContent()).not.toBe(before);
  }
  if (options.action) {
    await page.getByRole('button', { name: options.action, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  const photo = page.getByRole('img', { name: 'confirmed-photo', exact: true });
  await expect(photo).toBeVisible();
  await expect.poll(() => photo.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  const src = await photo.evaluate((image) => image.currentSrc);
  return page.evaluate(async (uri) => {
    const image = new Image();
    image.src = uri;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, 64, 64);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      pixels: Array.from(context.getImageData(0, 0, 64, 64).data),
    };
  }, src);
}

for (const [scenario, options] of [
  ['centered', {}],
  ['shifted', { shift: true }],
  ['user rotation', { action: 'Rotate' }],
  ['user flip', { action: 'Flip' }],
]) {
  for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8]) {
    test(`avatar EXIF ${orientation} ${scenario} matches orientation 1`, async ({ page }, testInfo) => {
      await page.goto('/');
      const reference = await confirmAvatar(page, 1, options);
      const actual = await confirmAvatar(page, orientation, options);
      const difference =
        actual.pixels.reduce(
          (total, value, index) => total + Math.abs(value - reference.pixels[index]),
          0,
        ) / actual.pixels.length;
      await testInfo.attach('pixel-result', {
        body: JSON.stringify({ orientation, scenario, difference, actual, reference }),
        contentType: 'application/json',
      });
      await page.screenshot({ path: testInfo.outputPath(`avatar-exif-${orientation}.png`), fullPage: true });
      expect({ width: actual.width, height: actual.height }).toEqual({
        width: reference.width,
        height: reference.height,
      });
      expect(difference).toBeLessThan(3);
    });
  }
}

async function decodePng(page, buffer) {
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      pixels: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data),
    };
  }, buffer.toString('base64'));
}

async function confirmWork(page, { file, shift = false, action }) {
  const input = page.getByLabel('source-photo');
  await input.evaluate((element) => {
    element.value = '';
  });
  await input.setInputFiles(path.resolve(__dirname, `../fixtures/exif/${file}`));
  await expect(page.getByTestId('status')).toHaveText('ready');
  await expect
    .poll(() => page.getByTestId('edit').textContent())
    .not.toBe('{"rotate":0,"flipHorizontal":false,"flipVertical":false,"crop":null}');
  const surface = page.getByRole('group', { name: /Кадрирование/ });
  if (shift) {
    await surface.focus();
    await surface.press('Shift+ArrowRight');
    await surface.press('Shift+ArrowDown');
  }
  if (action) await page.getByRole('button', { name: action, exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByTestId('status')).toHaveText('confirmed');
  const container = page.getByRole('img', { name: 'confirmed-work', exact: true });
  await expect(container).toBeVisible();
  const image = container.locator('img').last();
  await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  const preview = page.getByTestId('work-preview');
  const actual = await decodePng(page, await preview.screenshot());
  const expected = await page.evaluate(async () => {
    const edit = JSON.parse(document.querySelector('[data-testid="edit"]').textContent);
    const source = document.querySelector('[aria-label="confirmed-work"] img');
    const image = new Image();
    image.src = source.currentSrc;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 302;
    canvas.height = 368;
    const context = canvas.getContext('2d');
    const crop = edit.crop;
    const scale = Math.max(
      canvas.width / (image.naturalWidth * crop.width),
      canvas.height / (image.naturalHeight * crop.height),
    );
    const width = image.naturalWidth * crop.width * scale;
    const height = image.naturalHeight * crop.height * scale;
    context.drawImage(
      image,
      crop.x * image.naturalWidth,
      crop.y * image.naturalHeight,
      image.naturalWidth * crop.width,
      image.naturalHeight * crop.height,
      (canvas.width - width) / 2,
      (canvas.height - height) / 2,
      width,
      height,
    );
    return {
      width: canvas.width,
      height: canvas.height,
      pixels: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data),
    };
  });
  return { actual, expected, unchanged: await preview.getAttribute('data-unchanged') };
}

for (const [name, options] of [
  ['landscape centered', { file: 'asymmetric-1.jpg' }],
  ['landscape shifted', { file: 'asymmetric-1.jpg', shift: true }],
  ['portrait shifted', { file: 'portrait-1.jpg', shift: true }],
  ['square shifted', { file: 'square-1.jpg', shift: true }],
  ['EXIF portrait shifted', { file: 'asymmetric-6.jpg', shift: true }],
  ['user rotation', { file: 'asymmetric-1.jpg', shift: true, action: 'Rotate' }],
  ['user flip', { file: 'asymmetric-1.jpg', shift: true, action: 'Flip' }],
]) {
  test(`work preview ${name} matches its crop`, async ({ page }, testInfo) => {
    await page.goto('/?work');
    const { actual, expected, unchanged } = await confirmWork(page, options);
    const difference =
      actual.pixels.reduce(
        (total, value, index) => total + Math.abs(value - expected.pixels[index]),
        0,
      ) / actual.pixels.length;
    await testInfo.attach('work-pixel-result', {
      body: JSON.stringify({ name, difference, actual, expected, unchanged }),
      contentType: 'application/json',
    });
    await page.screenshot({ path: testInfo.outputPath('work-preview.png'), fullPage: true });
    if (options.file.endsWith('-1.jpg') && !options.action) expect(unchanged).toBe('true');
    expect({ width: actual.width, height: actual.height }).toEqual({ width: 302, height: 368 });
    expect(difference).toBeLessThan(3);
  });
}

for (const [name, options] of [
  ['crop-only', { file: 'asymmetric-1.jpg', shift: true }],
  ['transformed EXIF', { file: 'asymmetric-6.jpg', shift: true, action: 'Rotate' }],
]) {
  test(`work reopen preserves ${name} preview`, async ({ page }) => {
    await page.goto('/?work');
    const first = await confirmWork(page, options);
    await page.getByRole('button', { name: 'Reopen', exact: true }).click();
    await expect(page.getByTestId('status')).toHaveText('ready');
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(page.getByTestId('status')).toHaveText('confirmed');
    const preview = page.getByTestId('work-preview');
    const second = await decodePng(page, await preview.screenshot());
    const difference =
      second.pixels.reduce(
        (total, value, index) => total + Math.abs(value - first.actual.pixels[index]),
        0,
      ) / second.pixels.length;
    expect({ width: second.width, height: second.height }).toEqual({
      width: first.actual.width,
      height: first.actual.height,
    });
    expect(difference).toBeLessThan(3);
    expect(await preview.getAttribute('data-unchanged')).toBe('true');
  });
}
