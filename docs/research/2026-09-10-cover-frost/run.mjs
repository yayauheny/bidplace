import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../../..');
const mobileRequire = createRequire(resolve(root, 'apps/mobile/package.json'));
const transitiveRequire = createRequire(
  resolve(root, 'node_modules/.pnpm/node_modules/research.cjs'),
);
const { build } = transitiveRequire('esbuild');
const sharp = transitiveRequire('sharp');
const { chromium, firefox, webkit } = mobileRequire('@playwright/test');
const vendor =
  process.env.FROST_VENDOR ||
  '/private/tmp/cover-frost-vendor/package/dist/main.js';
const output = resolve(
  process.env.FROST_OUTPUT || '/private/tmp/cover-frost-results',
);
await mkdir(output, { recursive: true });
const built = await build({
  entryPoints: [resolve(directory, 'fixture.tsx')],
  bundle: true,
  write: false,
  minify: true,
  format: 'iife',
  jsx: 'automatic',
  alias: {
    'progressive-blur': vendor,
    '@bidplace/design-tokens': resolve(
      root,
      'packages/design-tokens/dist/index.js',
    ),
    react: dirname(mobileRequire.resolve('react/package.json')),
    'react-dom': dirname(mobileRequire.resolve('react-dom/package.json')),
  },
  define: { 'process.env.NODE_ENV': '"production"' },
});
const bundle = built.outputFiles[0].contents;
const font = await readFile(
  mobileRequire.resolve(
    '@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
  ),
);
const css = await readFile(resolve(directory, 'fixture.css'));
const colors = ['#eb4034', '#208ace', '#facf31', '#223448', '#e3eee8'];
const fixtures = Object.fromEntries(
  ['color', 'mono', 'contrast'].map((kind) => [
    kind,
    `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="352"><rect width="264" height="352" fill="#fff"/>${Array.from({ length: 33 }, (_, x) => `<rect x="${x * 8}" width="8" height="352" fill="${kind === 'color' ? colors[x % colors.length] : kind === 'mono' ? ['#151515', '#777', '#eee', '#aaa', '#444'][x % 5] : x % 2 ? '#fff' : '#000'}"/>`).join('')} ${kind !== 'contrast' ? '<circle cx="80" cy="255" r="55" fill="#eee"/><path d="M110 352L180 190L264 352" fill="#222"/>' : ''}</svg>`,
  ]),
);
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/font.ttf') {
    response.setHeader('Content-Type', 'font/ttf');
    response.end(font);
  } else if (path === '/app.js') {
    response.setHeader('Content-Type', 'text/javascript');
    response.end(bundle);
  } else if (path === '/style.css') {
    response.setHeader('Content-Type', 'text/css');
    response.end(css);
  } else if (path.endsWith('.svg')) {
    response.setHeader('Content-Type', 'image/svg+xml');
    response.end(fixtures[path.slice(1, -4)]);
  } else {
    response.setHeader('Content-Type', 'text/html');
    response.end(
      '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/app.js"></script></html>',
    );
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const variants = ['A', 'B3', 'B4', 'B5', 'C4', 'C6', 'C8', 'M'];
const results = {
  environment: {
    node: process.version,
    react: mobileRequire('react/package.json').version,
    viewport: [390, 844],
    deviceScaleFactor: 1,
    vendor,
    bundleBytes: bundle.length,
  },
  browsers: {},
};
const luminance = (r, g, b) =>
  [r, g, b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const quantile = (values, q) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * q))
  ];
async function pixels(buffer) {
  return sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}
async function metrics(buffer, baseline, titleHeight) {
  const {
    data,
    info: { width, height },
  } = await pixels(buffer);
  const reference = baseline ? (await pixels(baseline)).data : data;
  let absolute = 0,
    count = 0;
  const contrasts = [],
    rows = [],
    energies = [[], [], []];
  for (let y = 1; y < height - 1; y++) {
    let rowJump = 0;
    for (let x = 12; x < width - 12; x++) {
      const p = (y * width + x) * 3;
      const l = luminance(...data.subarray(p, p + 3));
      if (y >= 12 && y < 12 + titleHeight) contrasts.push(1.05 / (l + 0.05));
      const left = luminance(...data.subarray(p - 3, p));
      energies[Math.min(2, Math.floor((y / height) * 3))].push(
        Math.abs(l - left),
      );
      rowJump += Math.abs(
        l - luminance(...data.subarray(p - width * 3, p - width * 3 + 3)),
      );
      for (let c = 0; c < 3; c++)
        absolute += Math.abs(data[p + c] - reference[p + c]);
      count += 3;
    }
    rows.push(rowJump / (width - 24));
  }
  return {
    maeAgainstA: absolute / count,
    whiteTitleContrastMin: Math.min(...contrasts),
    whiteTitleContrastP05: quantile(contrasts, 0.05),
    horizontalEdgeEnergy: energies.map(
      (a) => a.reduce((s, v) => s + v, 0) / a.length,
    ),
    maxAdjacentRowLuminanceJump: Math.max(...rows),
    width,
    height,
  };
}
try {
  for (const [name, launcher] of Object.entries({
    chromium,
    firefox,
    webkit,
  }).filter(
    ([name]) =>
      !process.env.FROST_BROWSERS ||
      process.env.FROST_BROWSERS.split(',').includes(name),
  )) {
    let browser;
    try {
      browser = await launcher.launch({
        headless: process.env.FROST_HEADED !== '1',
        ...(name === 'chromium' && process.env.FROST_CHROME === '1'
          ? { channel: 'chrome' }
          : {}),
      });
    } catch (error) {
      results.browsers[name] = { unavailable: error.message };
      console.log(name, 'unavailable');
      continue;
    }
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const record = (results.browsers[name] = {
      version: browser.version(),
      variants: {},
      errors,
    });
    const baselines = {};
    record.cssSupport = await page.evaluate(() => ({
      backdrop: CSS.supports('backdrop-filter', 'blur(30px)'),
      mask: CSS.supports('mask-image', 'linear-gradient(transparent, black)'),
    }));
    for (const variant of variants) {
      const current = (record.variants[variant] = { images: {}, scroll: [] });
      for (const image of Object.keys(fixtures)) {
        await page.goto(`${origin}/?variant=${variant}&image=${image}`);
        await page.locator('img').evaluate((image) => image.decode());
        await page.evaluate(() => document.fonts.ready);
        const card = page.locator('.card');
        const frost = page.locator('.frost');
        assert.equal(await card.locator('img').count(), 1);
        assert.equal(await frost.getAttribute('aria-hidden'), 'true');
        assert.equal(
          await frost.evaluate((e) => getComputedStyle(e).pointerEvents),
          'none',
        );
        await page.screenshot({
          path: resolve(output, `${name}-${variant}-${image}-390.png`),
        });
        await page.locator('body').evaluate((e) => e.classList.add('measure'));
        const screenshot = await frost.screenshot({
          path: resolve(output, `${name}-${variant}-${image}-substrate.png`),
        });
        if (variant === 'A') baselines[image] = screenshot;
        await frost.evaluate((e) => {
          for (const n of [e, ...e.querySelectorAll('*')]) {
            n.style.setProperty('backdrop-filter', 'none', 'important');
            n.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
          }
        });
        const unfiltered = await frost.screenshot();
        current.images[image] = await metrics(
          screenshot,
          baselines[image],
          await page.locator('.content a').evaluate((e) => e.clientHeight),
        );
        current.images[image].filterChangesPixels =
          !screenshot.equals(unfiltered);
        await page.reload();
        await page.locator('img').evaluate((i) => i.decode());
      }
      current.a11y = await page.locator('.card').ariaSnapshot();
      await page.keyboard.press('Tab');
      current.defaultTabHitsLink = await page
        .locator('.content a')
        .evaluate((e) => e === document.activeElement);
      await page.locator('.expand').focus();
      const beforeHeight = await page
        .locator('.frost')
        .evaluate((e) => e.clientHeight);
      await page.keyboard.press('Enter');
      const afterHeight = await page
        .locator('.frost')
        .evaluate((e) => e.clientHeight);
      assert(afterHeight > beforeHeight);
      current.dynamicHeight = [beforeHeight, afterHeight];
      await page.locator('.swap').focus();
      await page.keyboard.press('Enter');
      await page.locator('img').evaluate((e) => e.decode());
      assert((await page.locator('img').getAttribute('src')).includes('color'));
      current.dynamicImage = true;
      await page.screenshot({
        path: resolve(output, `${name}-${variant}-dynamic.png`),
      });
      let mediaSession;
      for (const mode of ['forced', 'reduced']) {
        if (mode === 'forced')
          await page.emulateMedia({ forcedColors: 'active' });
        else if (name === 'chromium') {
          mediaSession = await context.newCDPSession(page);
          await mediaSession.send('Emulation.setEmulatedMedia', {
            features: [
              { name: 'prefers-reduced-transparency', value: 'reduce' },
            ],
          });
        } else {
          continue;
        }
        current[mode] = await page
          .locator('.frost')
          .evaluate((e) => ({
            backdrop: getComputedStyle(e).backdropFilter,
            tint: getComputedStyle(e.querySelector('.tint')).backgroundColor,
            forced: matchMedia('(forced-colors: active)').matches,
            reduced: matchMedia('(prefers-reduced-transparency: reduce)')
              .matches,
          }));
        await page.screenshot({
          path: resolve(output, `${name}-${variant}-${mode}.png`),
        });
        if (mediaSession) {
          await mediaSession.detach();
          mediaSession = undefined;
        }
        await page.emulateMedia({ forcedColors: 'none' });
      }
      await page.goto(`${origin}/?variant=${variant}&image=color&count=20`);
      await page
        .locator('img')
        .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
      assert.equal(await page.locator('img').count(), 20);
      current.scrollFilters = await page
        .locator('.frost')
        .first()
        .evaluate((e) =>
          [e, ...e.querySelectorAll('*')]
            .map((n) => getComputedStyle(n).backdropFilter)
            .filter((v) => v && v !== 'none'),
        );
      assert.equal(
        current.scrollFilters.length,
        variant === 'A' || variant === 'M' ? 1 : Number(variant.slice(1)),
      );
      const still = await page.locator('.card').first().screenshot();
      for (let repeat = 0; repeat < (name === 'chromium' ? 3 : 1); repeat++) {
        const timings = await page.evaluate(async () => {
          const timings = [];
          let previous;
          const maximum = document.documentElement.scrollHeight - innerHeight;
          for (let i = 0; i < 120; i++) {
            const now = await new Promise(requestAnimationFrame);
            if (previous !== undefined) timings.push(now - previous);
            previous = now;
            scrollTo(0, Math.round(maximum * (1 - Math.abs(1 - i / 59.5))));
          }
          scrollTo(0, 0);
          return timings;
        });
        current.scroll.push({
          medianMs: quantile(timings, 0.5),
          p95Ms: quantile(timings, 0.95),
          over25ms: timings.filter((t) => t > 25).length,
          frames: timings.length,
        });
      }
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const returned = await page.locator('.card').first().screenshot();
      current.scrollReturnPixelsEqual = still.equals(returned);
      assert(current.scrollReturnPixelsEqual);
      console.log(
        name,
        variant,
        JSON.stringify({
          contrast: current.images.contrast.whiteTitleContrastMin,
          scroll: current.scroll,
        }),
      );
      await writeFile(
        resolve(output, 'results.json'),
        JSON.stringify(results, null, 2),
      );
    }
    await browser.close();
  }
} finally {
  server.close();
  await writeFile(
    resolve(output, 'results.json'),
    JSON.stringify(results, null, 2),
  );
}
console.log(output);
