import { chromium, webkit } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const WEB = process.env.PARITY_WEB_URL ?? 'http://localhost:8011';
const OUT = join(
  import.meta.dirname,
  '../../../../artifacts/figma-qa/parity',
);

async function probe(browserType, engine) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 860 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${WEB}/seller/vex`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page
    .locator('[data-testid="figma-floating-dock"]')
    .waitFor({ timeout: 60_000 });
  await page.waitForFunction(async () => {
    await document.fonts.ready;
    return [...document.images].every(
      (image) => image.complete && image.naturalWidth > 0,
    );
  });

  const works = page.getByRole('tab', { name: /Работы/ });
  const about = page.getByRole('tab', { name: 'Об авторе' });
  await works.focus();
  await page.keyboard.press('ArrowRight');
  const afterRight = await about.evaluate((el) => ({
    selected: el.getAttribute('aria-selected'),
    focused: document.activeElement === el,
  }));
  await page.keyboard.press('Home');
  const afterHome = await works.evaluate((el) => ({
    selected: el.getAttribute('aria-selected'),
    focused: document.activeElement === el,
  }));
  await page.keyboard.press('End');
  const afterEnd = await about.evaluate((el) => ({
    selected: el.getAttribute('aria-selected'),
    focused: document.activeElement === el,
  }));

  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await page.waitForTimeout(80);
  const zoomed = await page.evaluate(() => {
    const dock = document.querySelector('[data-testid="figma-floating-dock"]');
    const tab = [...document.querySelectorAll('[role="tab"]')].find((node) =>
      node.textContent?.includes('Работы'),
    );
    const count = document.querySelector('[data-testid="figma-tab-count"]');
    const dockBox = dock?.getBoundingClientRect();
    const tabStyle = tab ? getComputedStyle(tab) : null;
    const countStyle = count ? getComputedStyle(count) : null;
    return {
      zoom: document.documentElement.style.zoom,
      dock: dockBox
        ? { width: dockBox.width, height: dockBox.height }
        : null,
      tab: tabStyle
        ? {
            fontSize: tabStyle.fontSize,
            letterSpacing: tabStyle.letterSpacing,
            lineHeight: tabStyle.lineHeight,
          }
        : null,
      count: countStyle
        ? {
            fontSize: countStyle.fontSize,
            fontWeight: countStyle.fontWeight,
            letterSpacing: countStyle.letterSpacing,
            lineHeight: countStyle.lineHeight,
          }
        : null,
    };
  });

  await browser.close();
  return { engine, afterRight, afterHome, afterEnd, zoomed };
}

const results = [];
for (const [type, name] of [
  [chromium, 'chromium'],
  [webkit, 'webkit'],
]) {
  results.push(await probe(type, name));
}
mkdirSync(OUT, { recursive: true });
writeFileSync(
  join(OUT, 'keyboard-zoom.json'),
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
