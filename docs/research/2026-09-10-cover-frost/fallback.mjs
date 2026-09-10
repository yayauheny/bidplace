import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = dirname(fileURLToPath(import.meta.url));
const require = createRequire(
  resolve(directory, '../../../apps/mobile/package.json'),
);
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(
    '<div class="frost" style="backdrop-filter:blur(30px)"><div class="tint" style="background-image:linear-gradient(transparent,#292929b3)">decorative</div></div>',
  );
  await page.addStyleTag({
    content: await readFile(resolve(directory, 'fixture.css'), 'utf8'),
  });
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  const result = await page
    .locator('.frost')
    .evaluate((e) => ({
      mediaMatches: matchMedia('(prefers-reduced-transparency: reduce)')
        .matches,
      backdrop: getComputedStyle(e).backdropFilter,
      tint: getComputedStyle(e.querySelector('.tint')).backgroundColor,
    }));
  await writeFile(
    '/private/tmp/cover-frost-results/fallback.json',
    JSON.stringify(result, null, 2),
  );
  console.log(result);
  if (
    !result.mediaMatches ||
    result.backdrop !== 'none' ||
    result.tint !== 'rgb(41, 41, 41)'
  )
    throw new Error('Reduced transparency fallback failed');
} finally {
  await browser.close();
}
